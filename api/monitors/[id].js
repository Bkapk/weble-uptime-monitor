const { connectToDatabase } = require('../db');
const { sendSlackNotification } = require('../utils/slack');

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;
    const prisma = await connectToDatabase();
    
    // Check if this is a /check route
    const url = req.url || '';
    if (url.includes('/check') && req.method === 'POST') {
      const monitor = await prisma.monitor.findUnique({ where: { id } });
      if (!monitor) {
        return res.status(404).json({ error: 'Monitor not found' });
      }
      
      const oldStatus = monitor.status;
      const result = await checkMonitor(monitor);
      
      // Parse existing history
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
      
      // Send Slack notification if status changed
      if (oldStatus !== result.status && oldStatus !== 'PENDING' && oldStatus !== 'PAUSED') {
        await sendSlackNotification({
          ...updated,
          name: monitor.name,
          url: monitor.url
        }, result.status);
      }
      
      const transformed = {
        ...updated,
        lastChecked: updated.lastChecked ? updated.lastChecked.getTime() : null,
        history: Array.isArray(updated.history) ? updated.history : []
      };
      
      return res.status(200).json(transformed);
    }
    
    // Check if this is a /toggle route
    if (url.includes('/toggle') && req.method === 'PATCH') {
      const monitor = await prisma.monitor.findUnique({ where: { id } });
      if (!monitor) {
        return res.status(404).json({ error: 'Monitor not found' });
      }
      
      const updated = await prisma.monitor.update({
        where: { id },
        data: {
          isPaused: !monitor.isPaused,
          status: !monitor.isPaused ? 'PAUSED' : 'PENDING'
        }
      });
      
      const transformed = {
        ...updated,
        lastChecked: updated.lastChecked ? updated.lastChecked.getTime() : null,
        history: Array.isArray(updated.history) ? updated.history : []
      };
      
      return res.status(200).json(transformed);
    }

    // PATCH /api/monitors/:id (update)
    if (req.method === 'PATCH') {
      const monitor = await prisma.monitor.findUnique({ where: { id } });
      if (!monitor) {
        return res.status(404).json({ error: 'Monitor not found' });
      }
      
      const body = await parseBody(req);
      const { url } = body;
      
      let updateData = { status: 'PENDING' };
      
      if (url) {
        let cleanUrl = url;
        if (!/^https?:\/\//i.test(url)) cleanUrl = `https://${url}`;
        updateData.url = cleanUrl;
        updateData.name = cleanUrl.replace(/^https?:\/\//i, '').split('/')[0];
      }
      
      const updated = await prisma.monitor.update({
        where: { id },
        data: updateData
      });
      
      // Transform response to match frontend types
      const transformed = {
        ...updated,
        lastChecked: updated.lastChecked ? updated.lastChecked.getTime() : null,
        history: Array.isArray(updated.history) ? updated.history : []
      };
      
      return res.status(200).json(transformed);
    }

    // DELETE /api/monitors/:id
    if (req.method === 'DELETE') {
      await prisma.monitor.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error in /api/monitors/${req.query.id}:`, error.message);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
