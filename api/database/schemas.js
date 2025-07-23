const { connectToMongoDB } = require('./connect');
const Team = require('./models/Team');
const Matchup = require('./models/Matchup');

// Initialize database collections and indexes
async function initializeDatabase() {
  try {
    const db = await connectToMongoDB();
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('teams')) {
      await db.createCollection('teams');
      console.log('Created teams collection');
    }
    
    if (!collectionNames.includes('matchups')) {
      await db.createCollection('matchups');
      console.log('Created matchups collection');
    }
    
    if (!collectionNames.includes('league')) {
      await db.createCollection('league');
      console.log('Created league collection');
    }
    
    // Create indexes
    const teamsCollection = db.collection('teams');
    const matchupsCollection = db.collection('matchups');
    
    // Team indexes
    for (const index of Team.getIndexes()) {
      await teamsCollection.createIndex(index);
    }
    
    // Matchup indexes
    for (const index of Matchup.getIndexes()) {
      await matchupsCollection.createIndex(index);
    }
    
    console.log('Database initialization complete');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Helper functions for database operations
async function saveTeams(teams, season = 2024) {
  const db = await connectToMongoDB();
  const collection = db.collection('teams');
  
  const operations = teams.map(teamData => {
    const team = new Team({ ...teamData, season });
    return {
      updateOne: {
        filter: { espnId: team.espnId, season: season },
        update: { $set: team.toDocument() },
        upsert: true
      }
    };
  });
  
  const result = await collection.bulkWrite(operations);
  return result;
}

async function saveMatchups(matchups, week, season = 2024) {
  const db = await connectToMongoDB();
  const collection = db.collection('matchups');
  
  const operations = matchups.map(matchupData => {
    const matchup = new Matchup({ ...matchupData, week, season });
    return {
      updateOne: {
        filter: { 
          week: matchup.week, 
          season: matchup.season,
          'team1.id': matchup.team1.id,
          'team2.id': matchup.team2.id
        },
        update: { $set: matchup.toDocument() },
        upsert: true
      }
    };
  });
  
  if (operations.length > 0) {
    const result = await collection.bulkWrite(operations);
    return result;
  }
  return null;
}

async function getTeams(season = 2024) {
  const db = await connectToMongoDB();
  const collection = db.collection('teams');
  
  const teams = await collection
    .find({ season })
    .sort({ 'laLigaBucks.total': -1 })
    .toArray();
  
  return teams;
}

async function getMatchups(week, season = 2024) {
  const db = await connectToMongoDB();
  const collection = db.collection('matchups');
  
  const matchups = await collection
    .find({ week, season })
    .toArray();
  
  return matchups;
}

module.exports = {
  initializeDatabase,
  saveTeams,
  saveMatchups,
  getTeams,
  getMatchups
};