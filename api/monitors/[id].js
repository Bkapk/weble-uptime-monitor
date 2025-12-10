const { connectToDatabase } = require('../db');

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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;
    const prisma = await connectToDatabase();

    // PATCH /api/monitors/:id (update)
    if (req.method === 'PATCH') {
      console.log(`📝 PATCH /api/monitors/${id}`);
      
      const monitor = await prisma.monitor.findUnique({ where: { id } });
      if (!monitor) {
        return res.status(404).json({ error: 'Monitor not found' });
      }
      
      const body = await parseBody(req);
      const { url } = body;
      
      let updateData = { status: 'PENDING' };
      
      if (url) {
        let cleanUrl = url;
        if (!/^https?:\/\//i.test(url)) cleanUrl = `https://${url}`;
        updateData.url = cleanUrl;
        updateData.name = cleanUrl.replace(/^https?:\/\//i, '').split('/')[0];
      }
      
      const updated = await prisma.monitor.update({
        where: { id },
        data: updateData
      });
      
      console.log(`✅ Updated monitor: ${id}`);
      
      // Transform response to match frontend types
      const transformed = {
        ...updated,
        lastChecked: updated.lastChecked ? updated.lastChecked.getTime() : null,
        history: Array.isArray(updated.history) ? updated.history : []
      };
      
      return res.status(200).json(transformed);
    }

    // DELETE /api/monitors/:id
    if (req.method === 'DELETE') {
      console.log(`🗑️  DELETE /api/monitors/${id}`);
      await prisma.monitor.delete({ where: { id } });
      console.log(`✅ Deleted monitor: ${id}`);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`❌ Error in /api/monitors/${req.query.id}:`, error.message);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
