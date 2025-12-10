const { connectToDatabase } = require('./db');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('📥 POST /api/monitors - Adding new monitors');
    
    const { urls } = req.body;
    if (!urls) {
      console.log('❌ No URLs provided');
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

    const { db } = await connectToDatabase();
    const monitorsCollection = db.collection('monitors');
    
    // Insert all monitors
    if (newMonitors.length > 0) {
      await monitorsCollection.insertMany(newMonitors);
      console.log(`✅ Added ${newMonitors.length} monitor(s) to database`);
    }
    
    return res.status(200).json(newMonitors);
  } catch (error) {
    console.error('❌ Error in add-monitors:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({ 
      error: 'Failed to add monitors',
      message: error.message 
    });
  }
};

