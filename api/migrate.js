// Migration endpoint for Vercel - run this once after first deployment
// You can call this via: POST /api/migrate
// Or run migrations manually using Vercel CLI: npx prisma migrate deploy

const { execSync } = require('child_process');

module.exports = async (req, res) => {
  // Optional: Add authentication here if needed
  // if (req.headers.authorization !== `Bearer ${process.env.MIGRATE_SECRET}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Running Prisma migrations...');
    
    // Run migrations
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env }
    });

    console.log('✅ Migrations completed successfully');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Migrations completed successfully' 
    });
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return res.status(500).json({ 
      error: 'Migration failed',
      message: error.message 
    });
  }
};

