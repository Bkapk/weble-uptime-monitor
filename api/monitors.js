const { connectToDatabase } = require('./db');
const crypto = require('crypto');

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
    const { db } = await connectToDatabase();
    const monitorsCollection = db.collection('monitors');

    // GET /api/monitors
    if (req.method === 'GET') {
      console.log('📥 GET /api/monitors');
      const monitors = await monitorsCollection.find({}).toArray();
      console.log(`✅ Found ${monitors.length} monitor(s)`);
      return res.status(200).json(monitors);
    }

    // POST /api/monitors
    if (req.method === 'POST') {
      console.log('📥 POST /api/monitors - Adding monitors');
      
      const { urls } = req.body;
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
          id: crypto.randomUUID(),
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
        await monitorsCollection.insertMany(newMonitors);
        console.log(`✅ Added ${newMonitors.length} monitor(s)`);
      }
      
      return res.status(200).json(newMonitors);
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

