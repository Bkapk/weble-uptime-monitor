const { connectToDatabase } = require('../../db');

async function checkMonitor(monitor) {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(monitor.url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: { 'User-Agent': 'WebleUptime/1.0' }
    });
    
    clearTimeout(timeoutId);
    const end = performance.now();
    const latency = Math.round(end - start);

    const isUp = response.ok || (response.status >= 200 && response.status < 400);

    return {
      status: isUp ? 'UP' : 'DOWN',
      statusCode: response.status,
      latency: latency
    };
  } catch (error) {
    return {
      status: 'DOWN',
      statusCode: 0,
      latency: 0
    };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;
    const prisma = await connectToDatabase();
    
    const monitor = await prisma.monitor.findUnique({ where: { id } });
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    
    const result = await checkMonitor(monitor);
    
    // Parse existing history - handle both array and JSON string
    let history = [];
    if (monitor.history) {
      if (Array.isArray(monitor.history)) {
        history = monitor.history;
      } else if (typeof monitor.history === 'string') {
        try {
          history = JSON.parse(monitor.history);
        } catch (e) {
          history = [];
        }
      }
    }
    
    history.push({ timestamp: Date.now(), latency: result.latency });
    if (history.length > 30) {
      history.shift();
    }
    
    const updated = await prisma.monitor.update({
      where: { id },
      data: {
        status: result.status,
        statusCode: result.statusCode,
        latency: result.latency,
        lastChecked: new Date(),
        history: history
      }
    });
    
    // Transform response to match frontend types
    const transformed = {
      ...updated,
      lastChecked: updated.lastChecked ? updated.lastChecked.getTime() : null,
      history: Array.isArray(updated.history) ? updated.history : []
    };
    
    return res.status(200).json(transformed);
  } catch (error) {
    console.error('Error in check-monitor:', error.message);
    return res.status(500).json({ error: 'Failed to check monitor' });
  }
};
