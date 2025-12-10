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
    const prisma = await connectToDatabase();

    // GET /api/settings
    if (req.method === 'GET') {
      let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
      
      if (!settings) {
        settings = await prisma.settings.create({
          data: { id: 'global', globalInterval: 3600 }
        });
      }
      
      return res.status(200).json(settings);
    }

    // PATCH /api/settings
    if (req.method === 'PATCH') {
      const body = await parseBody(req);
      const { globalInterval } = body;
      
      if (globalInterval === undefined || globalInterval < 10) {
        return res.status(400).json({ error: 'Invalid interval (must be >= 10 seconds)' });
      }
      
      const settings = await prisma.settings.upsert({
        where: { id: 'global' },
        update: { globalInterval },
        create: { id: 'global', globalInterval }
      });
      
      return res.status(200).json({ success: true, globalInterval: settings.globalInterval });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/settings:', error.message);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
