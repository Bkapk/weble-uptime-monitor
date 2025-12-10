const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { globalInterval } = req.body;
    console.log(`⚙️  PATCH /api/settings - New interval: ${globalInterval}s`);
    
    if (globalInterval === undefined || globalInterval < 10) {
      return res.status(400).json({ error: 'Invalid interval (must be >= 10 seconds)' });
    }
    
    const { db } = await connectToDatabase();
    const settingsCollection = db.collection('settings');
    
    await settingsCollection.updateOne(
      { _id: 'global' },
      { $set: { globalInterval } },
      { upsert: true }
    );
    
    console.log(`✅ Global interval updated to ${globalInterval}s`);
    return res.status(200).json({ success: true, globalInterval });
  } catch (error) {
    console.error('❌ Error in update-settings:', error.message);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
};

