// Shared database connection for Vercel serverless functions
const { MongoClient, ServerApiVersion } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'weble_uptime';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // Return cached connection if available
  if (cachedDb && cachedClient) {
    console.log('📦 Using cached MongoDB connection');
    return { db: cachedDb, client: cachedClient };
  }

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    console.error('Environment variables available:', Object.keys(process.env));
    throw new Error('MONGODB_URI is not configured');
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('URI starts with:', MONGODB_URI.substring(0, 30) + '...');
    
    const client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    console.log('✅ MongoDB client connected');
    
    const db = client.db(DB_NAME);
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('✅ MongoDB database accessible');

    // Cache for reuse
    cachedClient = client;
    cachedDb = db;

    return { db, client };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = { connectToDatabase, DB_NAME };

