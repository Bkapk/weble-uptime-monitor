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
      const monitors = await prisma.monitor.findMany({
        orderBy: { createdAt: 'asc' } // Keep original order (oldest first)
      });
      
      // Transform Prisma data to match frontend types
      const transformedMonitors = monitors.map(monitor => ({
        ...monitor,
        lastChecked: monitor.lastChecked ? monitor.lastChecked.getTime() : null,
        // Ensure history is an array
        history: Array.isArray(monitor.history) 
          ? monitor.history 
          : (typeof monitor.history === 'string' ? JSON.parse(monitor.history) : [])
      }));
      
      return res.status(200).json(transformedMonitors);
    }

    // POST /api/monitors
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const { urls } = body;
      if (!urls) {
        return res.status(400).json({ error: 'URLs required' });
      }

      const urlList = urls.split('\n').map(l => l.trim()).filter(l => l);
      
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
        await prisma.monitor.createMany({
          data: newMonitors
        });
      }
      
      // Return the created monitors in order they were added
      const createdMonitors = await prisma.monitor.findMany({
        where: {
          url: { in: newMonitors.map(m => m.url) }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      return res.status(200).json(createdMonitors);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/monitors:', error.message);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
};
