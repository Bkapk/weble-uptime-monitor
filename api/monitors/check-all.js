const { connectToDatabase } = require('../db');
const { sendSlackNotification } = require('../utils/slack');

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
    const prisma = await connectToDatabase();
    
    const monitors = await prisma.monitor.findMany({
      where: { isPaused: false }
    });
    
    let checkedCount = 0;
    const maxConcurrent = 5; // Check 5 at a time to avoid overwhelming the server
    
    // Process monitors in batches
    for (let i = 0; i < monitors.length; i += maxConcurrent) {
      const batch = monitors.slice(i, i + maxConcurrent);
      
      // Check batch in parallel
      await Promise.all(batch.map(async (monitor) => {
        try {
          const oldStatus = monitor.status; // Store old status to detect changes
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
            where: { id: monitor.id },
            data: {
              status: result.status,
              statusCode: result.statusCode,
              latency: result.latency,
              lastChecked: new Date(),
              history: history
            }
          });
          
          // Send Slack notification if status changed (skip PENDING status)
          if (oldStatus !== result.status && oldStatus !== 'PENDING' && oldStatus !== 'PAUSED') {
            await sendSlackNotification({
              ...updated,
              name: monitor.name,
              url: monitor.url
            }, result.status);
          }
          
          checkedCount++;
        } catch (err) {
          console.error(`Error checking ${monitor.name}:`, err.message);
        }
      }));
      
      // Small delay between batches to avoid rate limiting
      if (i + maxConcurrent < monitors.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      checked: checkedCount,
      total: monitors.length
    });
  } catch (error) {
    console.error('Error in check-all:', error.message);
    return res.status(500).json({ 
      error: 'Failed to check monitors',
      message: error.message 
    });
  }
};
