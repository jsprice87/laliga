const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connectToMongoDB() {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('laliga');
    console.log('Connected to MongoDB Atlas');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function closeMongoDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connectToMongoDB, closeMongoDB };