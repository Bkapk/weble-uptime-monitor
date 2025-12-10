const { connectToDatabase } = require('./db');
const crypto = require('crypto');

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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const prisma = await connectToDatabase();

    // GET /api/monitors
    if (req.method === 'GET') {
      console.log('📥 GET /api/monitors');
      const monitors = await prisma.monitor.findMany({
        orderBy: { createdAt: 'desc' }
      });
      console.log(`✅ Found ${monitors.length} monitor(s)`);
      return res.status(200).json(monitors);
    }

    // POST /api/monitors
    if (req.method === 'POST') {
      console.log('📥 POST /api/monitors - Adding monitors');
      
      const body = await parseBody(req);
      const { urls } = body;
      if (!urls) {
        return res.status(400).json({ error: 'URLs required' });
      }

      const urlList = urls.split('\n').map(l => l.trim()).filter(l => l);
      console.log(`📝 Processing ${urlList.length} URL(s)`);
      
      const newMonitors = urlList.map(url => {
        let cleanUrl = url;
        if (!/^https?:\/\//i.test(url)) cleanUrl = `https://${url}`;
        
        let name = cleanUrl.replace(/^https?:\/\//i, '').split('/')[0];

        return {
          url: cleanUrl,
          name: name,
          status: 'PENDING',
          statusCode: null,
          lastChecked: null,
          latency: null,
          history: [],
          isPaused: false
        };
      });

      if (newMonitors.length > 0) {
        const created = await prisma.monitor.createMany({
          data: newMonitors
        });
        console.log(`✅ Added ${created.count} monitor(s)`);
      }
      
      // Return the created monitors
      const createdMonitors = await prisma.monitor.findMany({
        where: {
          url: { in: newMonitors.map(m => m.url) }
        },
        orderBy: { createdAt: 'desc' },
        take: newMonitors.length
      });
      
      return res.status(200).json(createdMonitors);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error in /api/monitors:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
};
