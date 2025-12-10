const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('📥 GET /api/monitors - Fetching all monitors');
    
    const { db } = await connectToDatabase();
    const monitorsCollection = db.collection('monitors');
    
    const monitors = await monitorsCollection.find({}).toArray();
    console.log(`✅ Found ${monitors.length} monitor(s)`);
    
    return res.status(200).json(monitors);
  } catch (error) {
    console.error('❌ Error in get-monitors:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch monitors',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

