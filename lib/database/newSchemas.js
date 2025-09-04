const { connectToMongoDB } = require('./connect');

/**
 * NEW DATABASE SCHEMA - Proper Architecture
 * 
 * This replaces the broken structure with proper weekly historical data
 * that can be easily queried without frontend calculations.
 */

/**
 * Initialize new database collections with proper schema
 */
async function initializeNewDatabase() {
  try {
    const db = await connectToMongoDB();
    
    // Create new collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // 1. Master team reference table
    if (!collectionNames.includes('teams_master')) {
      await db.createCollection('teams_master');
      console.log('✅ Created teams_master collection');
    }
    
    // 2. Weekly standings snapshots  
    if (!collectionNames.includes('weekly_standings')) {
      await db.createCollection('weekly_standings');
      console.log('✅ Created weekly_standings collection');
    }
    
    // Create indexes for performance
    await createIndexes(db);
    
    console.log('🎯 New database schema initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ New database initialization error:', error);
    throw error;
  }
}

/**
 * Create optimized indexes for new collections
 */
async function createIndexes(db) {
  // teams_master indexes
  const teamsMasterCollection = db.collection('teams_master');
  await teamsMasterCollection.createIndex({ teamId: 1 }, { unique: true });
  await teamsMasterCollection.createIndex({ ownerName: 1 });
  
  // weekly_standings indexes  
  const weeklyStandingsCollection = db.collection('weekly_standings');
  await weeklyStandingsCollection.createIndex({ season: 1, week: 1, teamId: 1 }, { unique: true });
  await weeklyStandingsCollection.createIndex({ season: 1, week: 1, ligaBucks: -1 }); // For rankings
  await weeklyStandingsCollection.createIndex({ season: 1, week: 1 }); // For week queries
  
  console.log('📊 Database indexes created');
}

/**
 * Populate teams_master collection with owner mappings
 */
async function populateTeamsMaster() {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection('teams_master');
    
    // Master team owner mapping based on ESPN Team IDs
    const teamsMasterData = [
      { teamId: 1, ownerName: 'Jeff Parr', currentTeamName: 'Vonnies Chubbies' },
      { teamId: 2, ownerName: 'Scott Williams', currentTeamName: 'Murican Futball Crusaders' },
      { teamId: 3, ownerName: 'Steve Parr', currentTeamName: 'The Annexation of Puerto Rico' },
      { teamId: 4, ownerName: 'Matt George', currentTeamName: 'California Sunday School' },
      { teamId: 5, ownerName: 'Adam Haywood', currentTeamName: 'Blondes Give Me A Chubb' },
      { teamId: 8, ownerName: 'Justin Price', currentTeamName: 'I am Magic Claw' },
      { teamId: 10, ownerName: 'Evan Lengrich', currentTeamName: 'Show me your TDs' },
      { teamId: 11, ownerName: 'Eric Butler', currentTeamName: 'The Peeping Tomlins' },
      { teamId: 12, ownerName: 'Matt Kelsall', currentTeamName: 'Nothing to CTE Here' },
      { teamId: 13, ownerName: 'Nik Markley', currentTeamName: 'Hurts in the Brown Bachs' },
      { teamId: 14, ownerName: 'Boston Weir', currentTeamName: 'Purple Reign' },
      { teamId: 15, ownerName: 'Kris McKissack', currentTeamName: 'Kris P. Roni' }
    ];
    
    // Upsert each team master record
    const operations = teamsMasterData.map(team => ({
      updateOne: {
        filter: { teamId: team.teamId },
        update: { 
          $set: {
            ...team,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    }));
    
    const result = await collection.bulkWrite(operations);
    console.log(`✅ Teams master populated: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to populate teams master:', error);
    throw error;
  }
}

/**
 * Migrate existing teams data to new weekly_standings format
 * This will calculate Liga Bucks for week 14 of 2024 based on existing data
 */
async function migrateTeamsToWeeklyStandings() {
  try {
    const db = await connectToMongoDB();
    const teamsCollection = db.collection('teams');
    const weeklyStandingsCollection = db.collection('weekly_standings');
    
    // Get 2024 teams data
    const teams2024 = await teamsCollection.find({ season: 2024 }).toArray();
    
    if (teams2024.length === 0) {
      console.log('⚠️ No 2024 teams data found to migrate');
      return null;
    }
    
    console.log(`🔄 Migrating ${teams2024.length} teams from 2024 to weekly_standings...`);
    
    // Calculate Liga Bucks components for final standings (Week 14)
    const teamsWithLigaBucks = calculateLigaBucksForTeams(teams2024);
    
    // Create weekly_standings records for Week 14, 2024
    const weeklyStandingsData = teamsWithLigaBucks.map((team, index) => ({
      season: 2024,
      week: 14, // End of regular season
      teamId: team.espnId,
      teamName: team.name, // For reference
      rank: index + 1, // Liga Bucks ranking
      ligaBucks: team.calculatedLigaBucks,
      espnComponent: team.espnComponent,
      cumulativeComponent: team.cumulativeComponent,
      record: {
        wins: team.record?.overall?.wins || 0,
        losses: team.record?.overall?.losses || 0,
        ties: team.record?.overall?.ties || 0
      },
      totalPoints: team.totalPoints || 0,
      pointsAgainst: team.record?.overall?.pointsAgainst || 0,
      playoffSeed: team.playoffSeed || 0,
      lastUpdated: new Date()
    }));
    
    // Insert weekly standings
    const operations = weeklyStandingsData.map(standing => ({
      updateOne: {
        filter: { 
          season: standing.season, 
          week: standing.week, 
          teamId: standing.teamId 
        },
        update: { $set: standing },
        upsert: true
      }
    }));
    
    const result = await weeklyStandingsCollection.bulkWrite(operations);
    console.log(`✅ Weekly standings migrated: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to migrate teams to weekly standings:', error);
    throw error;
  }
}

/**
 * Calculate Liga Bucks for teams (2-component system)
 */
function calculateLigaBucksForTeams(teams) {
  // Sort by total points for cumulative component (with Points Against tiebreaker)
  const pointsSorted = [...teams].sort((a, b) => {
    const pointsA = a.totalPoints || 0;
    const pointsB = b.totalPoints || 0;
    
    if (pointsA !== pointsB) {
      return pointsB - pointsA; // Higher points = better
    }
    
    // Tiebreaker: Points Against (lower is better)
    const pointsAgainstA = a.record?.overall?.pointsAgainst || 0;
    const pointsAgainstB = b.record?.overall?.pointsAgainst || 0;
    return pointsAgainstA - pointsAgainstB;
  });
  
  // Assign cumulative components (1-12 points)
  pointsSorted.forEach((team, index) => {
    team.cumulativeComponent = Math.max(1, 12 - index);
  });
  
  // Calculate ESPN components and total Liga Bucks
  const teamsWithLigaBucks = teams.map(team => {
    // ESPN Component: 13 - ESPN rank (so rank 1 = 12 points, rank 12 = 1 point)
    const espnComponent = Math.max(1, Math.min(12, 13 - (team.playoffSeed || 12)));
    
    const calculatedLigaBucks = espnComponent + (team.cumulativeComponent || 0);
    
    return {
      ...team,
      espnComponent,
      calculatedLigaBucks
    };
  });
  
  // Sort by Liga Bucks for final rankings (with Points Against tiebreaker)
  return teamsWithLigaBucks.sort((a, b) => {
    if (a.calculatedLigaBucks !== b.calculatedLigaBucks) {
      return b.calculatedLigaBucks - a.calculatedLigaBucks;
    }
    
    const pointsAgainstA = a.record?.overall?.pointsAgainst || 0;
    const pointsAgainstB = b.record?.overall?.pointsAgainst || 0;
    return pointsAgainstA - pointsAgainstB;
  });
}

/**
 * Get teams data from new weekly_standings collection
 */
async function getWeeklyStandings(season, week) {
  try {
    const db = await connectToMongoDB();
    const weeklyStandingsCollection = db.collection('weekly_standings');
    const teamsMasterCollection = db.collection('teams_master');
    
    // Get weekly standings
    const standings = await weeklyStandingsCollection
      .find({ season: parseInt(season), week: parseInt(week) })
      .sort({ ligaBucks: -1, pointsAgainst: 1 }) // Sort by Liga Bucks desc, Points Against asc
      .toArray();
    
    if (standings.length === 0) {
      console.log(`⚠️ No weekly standings found for ${season} week ${week}`);
      return [];
    }
    
    // Join with teams master for owner names
    const teamsMaster = await teamsMasterCollection.find({}).toArray();
    const teamsMasterMap = new Map(teamsMaster.map(tm => [tm.teamId, tm]));
    
    // Combine standings with master data
    const enrichedStandings = standings.map(standing => {
      const masterData = teamsMasterMap.get(standing.teamId);
      
      return {
        id: standing.teamId,
        name: standing.teamName,
        owner: masterData?.ownerName || `Team ${standing.teamId} Owner`,
        abbrev: '', // Could be added to teams_master if needed
        logo: '', // Could be added to teams_master if needed
        record: standing.record,
        totalPoints: standing.totalPoints,
        espnRank: standing.rank,
        playoffSeed: standing.playoffSeed,
        laLigaBucks: standing.ligaBucks,
        espnComponent: standing.espnComponent,
        cumulativeComponent: standing.cumulativeComponent,
        earnings: 0, // Could be calculated separately
        weeklyHighScores: 0 // Could be calculated separately
      };
    });
    
    console.log(`✅ Retrieved ${enrichedStandings.length} weekly standings for ${season} week ${week}`);
    return enrichedStandings;
  } catch (error) {
    console.error(`❌ Failed to get weekly standings for ${season} week ${week}:`, error);
    return [];
  }
}

module.exports = {
  initializeNewDatabase,
  populateTeamsMaster,
  migrateTeamsToWeeklyStandings,
  getWeeklyStandings
};