const { connectToMongoDB } = require('./connect');
const Team = require('./models/Team');
const Matchup = require('./models/Matchup');
const League = require('./models/League');

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
    const leagueCollection = db.collection('league');
    
    // Team indexes
    for (const index of Team.getIndexes()) {
      await teamsCollection.createIndex(index);
    }
    
    // Matchup indexes
    for (const index of Matchup.getIndexes()) {
      await matchupsCollection.createIndex(index);
    }
    
    // League indexes
    for (const index of League.getIndexes()) {
      await leagueCollection.createIndex(index);
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
  try {
    const db = await connectToMongoDB();
    const collection = db.collection('teams');
    
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      console.warn(`⚠️ Invalid teams data for season ${season}:`, { 
        type: typeof teams, 
        isArray: Array.isArray(teams), 
        length: teams?.length 
      });
      return null;
    }
    
    const operations = teams.map((teamData, index) => {
      try {
        const team = new Team({ ...teamData, season });
        return {
          updateOne: {
            filter: { espnId: team.espnId, season: season },
            update: { $set: team.toDocument() },
            upsert: true
          }
        };
      } catch (teamError) {
        console.error(`❌ Error creating team operation ${index + 1}:`, teamError.message, teamData);
        return null;
      }
    }).filter(Boolean);
    
    if (operations.length === 0) {
      console.warn(`⚠️ No valid team operations created for season ${season}`);
      return null;
    }
    
    console.log(`🔄 Saving ${operations.length} teams to MongoDB for season ${season}`);
    const result = await collection.bulkWrite(operations);
    console.log(`✅ Teams saved: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to save teams for season ${season}:`, error.message);
    throw error;
  }
}

async function saveMatchups(matchups, week, season = 2024) {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection('matchups');
    
    if (!matchups || !Array.isArray(matchups) || matchups.length === 0) {
      console.warn(`⚠️ Invalid matchups data for Week ${week}, Season ${season}:`, {
        type: typeof matchups,
        isArray: Array.isArray(matchups),
        length: matchups?.length
      });
      return null;
    }
    
    const operations = matchups.map((matchupData, index) => {
      try {
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
      } catch (matchupError) {
        console.error(`❌ Error creating matchup operation ${index + 1}:`, matchupError.message, matchupData);
        return null;
      }
    }).filter(Boolean);
    
    if (operations.length === 0) {
      console.warn(`⚠️ No valid matchup operations created for Week ${week}, Season ${season}`);
      return null;
    }
    
    console.log(`🔄 Saving ${operations.length} matchups to MongoDB for Week ${week}, Season ${season}`);
    const result = await collection.bulkWrite(operations);
    console.log(`✅ Matchups saved: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to save matchups for Week ${week}, Season ${season}:`, error.message);
    throw error;
  }
}

async function getTeams(season = 2024) {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection('teams');
    
    const teams = await collection
      .find({ season: parseInt(season) })
      .sort({ 
        'laLigaBucks.total': -1,
        'points': -1,  // Fallback sort by total points if Liga Bucks not available
        'name': 1      // Final fallback by name
      })
      .toArray();
    
    console.log(`🔍 Retrieved ${teams.length} teams for season ${season}`);
    return teams;
  } catch (error) {
    console.error(`❌ Failed to get teams for season ${season}:`, error.message);
    return [];
  }
}

async function getMatchups(week, season = 2024) {
  const db = await connectToMongoDB();
  const collection = db.collection('matchups');
  
  const matchups = await collection
    .find({ week, season })
    .toArray();
  
  return matchups;
}

async function saveLeague(leagueData, season = 2024) {
  const db = await connectToMongoDB();
  const collection = db.collection('league');
  
  const league = new League({ ...leagueData, season });
  
  const result = await collection.updateOne(
    { season: season },
    { $set: league.toDocument() },
    { upsert: true }
  );
  
  return result;
}

async function getLeague(season = 2024) {
  const db = await connectToMongoDB();
  const collection = db.collection('league');
  
  const league = await collection.findOne({ season });
  return league;
}

module.exports = {
  initializeDatabase,
  saveTeams,
  saveMatchups,
  getTeams,
  getMatchups,
  saveLeague,
  getLeague
};