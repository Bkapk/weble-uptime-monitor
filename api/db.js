// Prisma client for Vercel serverless functions
const { PrismaClient } = require('@prisma/client');

let prisma = null;
let migrationChecked = false;

function getPrismaClient() {
  if (!prisma) {
    console.log('🔄 Initializing Prisma Client...');
    
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Handle connection errors
    prisma.$connect().catch((error) => {
      console.error('❌ Prisma connection failed:', error.message);
      throw error;
    });
  }
  
  return prisma;
}

// Check if migrations need to be run and run them automatically
async function ensureMigrations() {
  if (migrationChecked) {
    return; // Already checked
  }

  try {
    const client = getPrismaClient();
    
    // Try to query the Settings table - if it doesn't exist, migrations haven't run
    try {
      await client.settings.findUnique({ where: { id: 'global' } });
      console.log('✅ Database tables exist - migrations already applied');
      migrationChecked = true;
      return;
    } catch (error) {
      // Table doesn't exist, need to run migrations
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        console.log('🔄 Database tables not found - running migrations...');
        
        // Run migrations using Prisma Migrate
        const { execSync } = require('child_process');
        try {
          execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log('✅ Migrations completed successfully');
          migrationChecked = true;
        } catch (migrateError) {
          console.error('❌ Migration failed:', migrateError.message);
          // Don't throw - let the app continue, migrations can be run manually
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error checking migrations:', error.message);
    // Don't block the app - migrations might already be applied
    migrationChecked = true;
  }
}

// For Vercel serverless functions, we need to ensure the client is properly initialized
async function connectToDatabase() {
  try {
    // Ensure migrations are run first
    await ensureMigrations();
    
    const client = getPrismaClient();
    
    // Test the connection
    await client.$queryRaw`SELECT 1`;
    console.log('✅ Prisma database connected');
    
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = { connectToDatabase, getPrismaClient, ensureMigrations };
