// Prisma client for Vercel serverless functions
const { PrismaClient } = require('@prisma/client');

let prisma = null;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error'],
    });

    // Handle connection errors
    prisma.$connect().catch((error) => {
      console.error('Prisma connection failed:', error.message);
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
    
    return client;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

module.exports = { connectToDatabase, getPrismaClient };
