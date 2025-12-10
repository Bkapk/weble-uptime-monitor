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
    
    const prisma = await connectToDatabase();
    
    const monitor = await prisma.monitor.findUnique({ where: { id } });
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    
    const updated = await prisma.monitor.update({
      where: { id },
      data: {
        isPaused: !monitor.isPaused,
        status: !monitor.isPaused ? 'PAUSED' : 'PENDING'
      }
    });
    
    console.log(`✅ Toggled monitor: ${id} - isPaused: ${updated.isPaused}`);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Error in toggle-monitor:', error.message);
    return res.status(500).json({ error: 'Failed to toggle monitor' });
  }
};
