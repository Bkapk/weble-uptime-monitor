const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('📥 GET /api/settings');
    
    const { db } = await connectToDatabase();
    const settingsCollection = db.collection('settings');
    
    let settings = await settingsCollection.findOne({ _id: 'global' });
    
    if (!settings) {
      settings = { globalInterval: 3600 };
      await settingsCollection.insertOne({ _id: 'global', ...settings });
      console.log('✅ Created default settings');
    }
    
    console.log(`✅ Settings fetched: interval = ${settings.globalInterval}s`);
    return res.status(200).json(settings);
  } catch (error) {
    console.error('❌ Error in get-settings:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch settings',
      message: error.message 
    });
  }
};

