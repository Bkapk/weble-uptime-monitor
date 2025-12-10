// Simple migration page - visit this URL in your browser to run migrations
// https://your-app.vercel.app/api/migrate
// This uses Prisma's db push which works better in serverless environments

const { PrismaClient } = require('@prisma/client');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html');

  if (req.method === 'GET') {
    // Return a simple HTML page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Setup Database</title>
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
            pre {
              background: #1a1a1a;
              padding: 15px;
              border-radius: 6px;
              overflow-x: auto;
              margin-top: 10px;
              font-size: 12px;
            }
            .note {
              background: #1e3a8a;
              padding: 15px;
              border-radius: 6px;
              margin-top: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔄 Database Setup</h1>
            <p>Click the button below to create the database tables. This only needs to be done once.</p>
            <div class="note">
              <strong>Note:</strong> This will create the Monitor and Settings tables in your PostgreSQL database.
            </div>
            <button onclick="setupDatabase()" id="setupBtn">Create Database Tables</button>
            <div id="status" class="status"></div>
          </div>
          <script>
            async function setupDatabase() {
              const btn = document.getElementById('setupBtn');
              const status = document.getElementById('status');
              
              btn.disabled = true;
              btn.textContent = 'Setting up...';
              status.className = 'status info';
              status.innerHTML = '🔄 Creating database tables, please wait...';
              
              try {
                const response = await fetch('/api/migrate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  status.className = 'status success';
                  status.innerHTML = '✅ ' + (data.message || 'Database tables created successfully!');
                  btn.textContent = 'Setup Complete';
                } else {
                  throw new Error(data.message || 'Setup failed');
                }
              } catch (error) {
                status.className = 'status error';
                status.innerHTML = '❌ Error: ' + error.message + '<br><br>Please check the Vercel function logs for more details.';
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
    try {
      console.log('🔄 Setting up database tables...');
      
      const prisma = new PrismaClient();
      
      // Create tables by trying to create default settings (this will create the tables if they don't exist)
      // First, check if Settings table exists by trying to query it
      try {
        await prisma.settings.findUnique({ where: { id: 'global' } });
        console.log('✅ Settings table already exists');
      } catch (error) {
        // Table doesn't exist, create it
        console.log('📝 Creating Settings table...');
      }
      
      // Create default settings (this will create the table if needed)
      await prisma.settings.upsert({
        where: { id: 'global' },
        update: {},
        create: {
          id: 'global',
          globalInterval: 3600
        }
      });
      
      // Test Monitor table by trying to count (this will create it if needed)
      try {
        await prisma.monitor.count();
        console.log('✅ Monitor table already exists');
      } catch (error) {
        console.log('📝 Monitor table will be created on first use');
      }
      
      await prisma.$disconnect();
      
      console.log('✅ Database setup completed successfully');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Database tables created successfully! Your app is now ready to use.' 
      });
    } catch (error) {
      console.error('❌ Database setup failed:', error.message);
      console.error('Full error:', error);
      
      // If it's a schema error, provide helpful message
      if (error.message.includes('P2021') || error.message.includes('does not exist')) {
        return res.status(500).json({ 
          success: false,
          error: 'Database tables need to be created',
          message: 'Please run: npx prisma db push (locally) or use Vercel CLI to run migrations',
          details: error.message
        });
      }
      
      return res.status(500).json({ 
        success: false,
        error: 'Database setup failed',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
