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
    const id = req.query.id || req.url.split('/').pop();
    const { url } = req.body;
    
    console.log(`📝 PATCH /api/monitors/${id}`);
    
    const { db } = await connectToDatabase();
    const monitorsCollection = db.collection('monitors');
    
    const monitor = await monitorsCollection.findOne({ id });
    
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    
    if (url) {
      let cleanUrl = url;
      if (!/^https?:\/\//i.test(url)) cleanUrl = `https://${url}`;
      monitor.url = cleanUrl;
      monitor.name = cleanUrl.replace(/^https?:\/\//i, '').split('/')[0];
    }
    
    monitor.status = 'PENDING';
    
    await monitorsCollection.updateOne({ id }, { $set: monitor });
    console.log(`✅ Updated monitor: ${id}`);
    
    return res.status(200).json(monitor);
  } catch (error) {
    console.error('❌ Error in update-monitor:', error.message);
    return res.status(500).json({ error: 'Failed to update monitor' });
  }
};

