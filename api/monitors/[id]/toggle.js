const { connectToDatabase } = require('../../db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;
    console.log(`⏸️  PATCH /api/monitors/${id}/toggle`);
    
    const { db } = await connectToDatabase();
    const monitorsCollection = db.collection('monitors');
    
    const monitor = await monitorsCollection.findOne({ id });
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    
    monitor.isPaused = !monitor.isPaused;
    monitor.status = monitor.isPaused ? 'PAUSED' : 'PENDING';
    
    await monitorsCollection.updateOne({ id }, { $set: monitor });
    console.log(`✅ Toggled monitor: ${id} - isPaused: ${monitor.isPaused}`);
    
    return res.status(200).json(monitor);
  } catch (error) {
    console.error('❌ Error in toggle-monitor:', error.message);
    return res.status(500).json({ error: 'Failed to toggle monitor' });
  }
};

