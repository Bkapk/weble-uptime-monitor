// Prisma client for Vercel serverless functions
const { PrismaClient } = require('@prisma/client');

let prisma = null;

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

// For Vercel serverless functions, we need to ensure the client is properly initialized
async function connectToDatabase() {
  try {
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

module.exports = { connectToDatabase, getPrismaClient };
