// Simple migration page - visit this URL in your browser to run migrations
// https://your-app.vercel.app/api/migrate

const { execSync } = require('child_process');

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
          <title>Run Database Migrations</title>
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
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔄 Database Migration</h1>
            <p>Click the button below to run database migrations. This will create the necessary tables in your PostgreSQL database.</p>
            <button onclick="runMigration()" id="migrateBtn">Run Migrations</button>
            <div id="status" class="status"></div>
          </div>
          <script>
            async function runMigration() {
              const btn = document.getElementById('migrateBtn');
              const status = document.getElementById('status');
              
              btn.disabled = true;
              btn.textContent = 'Running...';
              status.className = 'status info';
              status.innerHTML = '🔄 Running migrations, please wait...';
              
              try {
                const response = await fetch('/api/migrate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  status.className = 'status success';
                  status.innerHTML = '✅ ' + (data.message || 'Migrations completed successfully!');
                  btn.textContent = 'Migrations Complete';
                } else {
                  throw new Error(data.message || 'Migration failed');
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
    try {
      console.log('🔄 Running Prisma migrations...');
      
      // Run migrations
      execSync('npx prisma migrate deploy', {
        stdio: 'pipe',
        env: { ...process.env }
      });

      console.log('✅ Migrations completed successfully');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Migrations completed successfully! Your database is now ready.' 
      });
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      return res.status(500).json({ 
        success: false,
        error: 'Migration failed',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
