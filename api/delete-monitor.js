const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const id = req.query.id || req.url.split('/').pop();
    console.log(`🗑️  DELETE /api/monitors/${id}`);
    
    const { db } = await connectToDatabase();
    const monitorsCollection = db.collection('monitors');
    
    await monitorsCollection.deleteOne({ id });
    console.log(`✅ Deleted monitor: ${id}`);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error in delete-monitor:', error.message);
    return res.status(500).json({ error: 'Failed to delete monitor' });
  }
};

