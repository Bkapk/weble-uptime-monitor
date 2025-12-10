const { connectToDatabase } = require('./db');

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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const settingsCollection = db.collection('settings');

    // GET /api/settings
    if (req.method === 'GET') {
      console.log('📥 GET /api/settings');
      
      let settings = await settingsCollection.findOne({ _id: 'global' });
      
      if (!settings) {
        settings = { globalInterval: 3600 };
        await settingsCollection.insertOne({ _id: 'global', ...settings });
        console.log('✅ Created default settings');
      }
      
      console.log(`✅ Settings: interval = ${settings.globalInterval}s`);
      return res.status(200).json(settings);
    }

    // PATCH /api/settings
    if (req.method === 'PATCH') {
      const body = await parseBody(req);
      const { globalInterval } = body;
      console.log(`⚙️  PATCH /api/settings - New interval: ${globalInterval}s`);
      
      if (globalInterval === undefined || globalInterval < 10) {
        return res.status(400).json({ error: 'Invalid interval (must be >= 10 seconds)' });
      }
      
      await settingsCollection.updateOne(
        { _id: 'global' },
        { $set: { globalInterval } },
        { upsert: true }
      );
      
      console.log(`✅ Interval updated to ${globalInterval}s`);
      return res.status(200).json({ success: true, globalInterval });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error in /api/settings:', error.message);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};

