const { connectToDatabase } = require('./db');

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
    console.log('🔄 POST /api/monitors/check-all - Starting batch check');
    
    const { db } = await connectToDatabase();
    const monitorsCollection = db.collection('monitors');
    
    const monitors = await monitorsCollection.find({}).toArray();
    const activeMonitors = monitors.filter(m => !m.isPaused);
    
    console.log(`📊 Found ${activeMonitors.length} active monitor(s) to check`);
    
    let checkedCount = 0;
    
    // Check up to 10 monitors to avoid timeout
    for (const monitor of activeMonitors.slice(0, 10)) {
      try {
        console.log(`🔍 Checking: ${monitor.name}`);
        const result = await checkMonitor(monitor);
        
        monitor.status = result.status;
        monitor.statusCode = result.statusCode;
        monitor.latency = result.latency;
        monitor.lastChecked = Date.now();
        
        if (!monitor.history) monitor.history = [];
        monitor.history.push({ timestamp: Date.now(), latency: result.latency });
        if (monitor.history.length > 30) {
          monitor.history.shift();
        }
        
        await monitorsCollection.updateOne({ id: monitor.id }, { $set: monitor });
        console.log(`✅ ${monitor.name}: ${result.status}`);
        checkedCount++;
      } catch (err) {
        console.error(`❌ Error checking ${monitor.name}:`, err.message);
      }
    }
    
    console.log(`✅ Batch check complete: ${checkedCount}/${activeMonitors.length} checked`);
    
    return res.status(200).json({ 
      success: true, 
      message: `Checked ${checkedCount} monitor(s)`,
      checked: checkedCount,
      total: activeMonitors.length
    });
  } catch (error) {
    console.error('❌ Error in check-all:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({ 
      error: 'Failed to check monitors',
      message: error.message 
    });
  }
};

