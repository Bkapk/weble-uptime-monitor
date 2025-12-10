// One-click database setup - visit this URL to create all tables
// https://your-app.vercel.app/api/setup

const { PrismaClient } = require('@prisma/client');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html');

  if (req.method === 'GET') {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Database Setup</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #1a1a1a;
              color: #fff;
            }
            .container {
              background: #2a2a2a;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            }
            h1 { color: #4ade80; margin-top: 0; }
            button {
              background: #4ade80;
              color: #000;
              border: none;
              padding: 12px 24px;
              font-size: 16px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: bold;
              margin-top: 20px;
            }
            button:hover { background: #22c55e; }
            button:disabled { background: #666; cursor: not-allowed; }
            .status {
              margin-top: 20px;
              padding: 15px;
              border-radius: 6px;
              background: #333;
              display: none;
            }
            .status.success { background: #065f46; color: #4ade80; display: block; }
            .status.error { background: #7f1d1d; color: #f87171; display: block; }
            .status.info { background: #1e3a8a; color: #60a5fa; display: block; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Database Setup</h1>
            <p>Click the button below to create all database tables. This only needs to be done once.</p>
            <button onclick="setupDatabase()" id="setupBtn">Create Database Tables</button>
            <div id="status" class="status"></div>
          </div>
          <script>
            async function setupDatabase() {
              const btn = document.getElementById('setupBtn');
              const status = document.getElementById('status');
              
              btn.disabled = true;
              btn.textContent = 'Creating tables...';
              status.className = 'status info';
              status.innerHTML = '🔄 Creating database tables, please wait...';
              
              try {
                const response = await fetch('/api/setup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  status.className = 'status success';
                  status.innerHTML = '✅ ' + (data.message || 'Database tables created successfully!');
                  btn.textContent = 'Setup Complete';
                  btn.style.background = '#22c55e';
                } else {
                  throw new Error(data.message || 'Setup failed');
                }
              } catch (error) {
                status.className = 'status error';
                status.innerHTML = '❌ Error: ' + error.message;
                btn.disabled = false;
                btn.textContent = 'Try Again';
              }
            }
          </script>
        </body>
      </html>
    `);
  }

  if (req.method === 'POST') {
    const prisma = new PrismaClient();
    
    try {
      console.log('🔄 Creating database tables from scratch...');
      
      // Create Monitor table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Monitor" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "url" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "statusCode" INTEGER,
          "lastChecked" TIMESTAMP(3),
          "latency" INTEGER,
          "history" JSONB NOT NULL DEFAULT '[]',
          "isPaused" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        );
      `;
      console.log('✅ Monitor table created');
      
      // Create index on isPaused
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "Monitor_isPaused_idx" ON "Monitor"("isPaused");
      `;
      console.log('✅ Index created');
      
      // Create Settings table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Settings" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "globalInterval" INTEGER NOT NULL DEFAULT 3600,
          "updatedAt" TIMESTAMP(3) NOT NULL
        );
      `;
      console.log('✅ Settings table created');
      
      // Insert default settings
      await prisma.$executeRaw`
        INSERT INTO "Settings" ("id", "globalInterval", "updatedAt")
        VALUES ('global', 3600, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO NOTHING;
      `;
      console.log('✅ Default settings created');
      
      await prisma.$disconnect();
      
      console.log('✅ All database tables created successfully!');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Database tables created successfully! Your app is now ready to use. 🎉' 
      });
    } catch (error) {
      console.error('❌ Database setup failed:', error.message);
      console.error('Full error:', error);
      
      await prisma.$disconnect();
      
      return res.status(500).json({ 
        success: false,
        error: 'Database setup failed',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

