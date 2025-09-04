/**
 * Health Controller - System health and diagnostic endpoints
 * Handles health checks, database testing, and environment debugging
 */

const { connectToMongoDB } = require('../database/connect');

class HealthController {
  /**
   * Basic health check endpoint
   * GET /api/health
   */
  static async health(req, res) {
    try {
      return res.status(200).json({ 
        status: 'OK', 
        message: 'La Liga del Fuego API is running',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Health check failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test MongoDB connection
   * GET /api/test-db
   */
  static async testDatabase(req, res) {
    try {
      console.log('🔍 Testing MongoDB connection...');
      console.log('URI format:', process.env.MONGODB_URI?.substring(0, 50) + '...');
      
      const db = await connectToMongoDB();
      const result = await db.admin().ping();
      
      console.log('✅ MongoDB connection successful!');
      return res.status(200).json({ 
        message: 'MongoDB connection successful', 
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.error('Full error:', error);
      
      return res.status(500).json({
        error: 'MongoDB connection failed',
        details: error.message,
        mongoUriStart: process.env.MONGODB_URI?.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Debug environment variables
   * GET /api/debug-env
   */
  static async debugEnvironment(req, res) {
    try {
      return res.status(200).json({
        mongoUriExists: !!process.env.MONGODB_URI,
        mongoUriLength: process.env.MONGODB_URI?.length || 0,
        mongoUriStart: process.env.MONGODB_URI?.substring(0, 50) + '...',
        espnLeagueId: process.env.ESPN_LEAGUE_ID,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Environment debug failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Debug data stored in MongoDB
   * GET /api/debug-data
   */
  static async debugData(req, res) {
    try {
      const { season = 2025 } = Object.fromEntries(new URL(req.url, `http://${req.headers.host}`).searchParams);
      
      const db = await connectToMongoDB();
      
      const teamsCount = await db.collection('teams').countDocuments({ season: parseInt(season) });
      const matchupsCount = await db.collection('matchups').countDocuments({ season: parseInt(season) });
      const leagueCount = await db.collection('league').countDocuments({ season: parseInt(season) });
      
      const sampleTeam = await db.collection('teams').findOne({ season: parseInt(season) });
      const sampleMatchup = await db.collection('matchups').findOne({ season: parseInt(season) });
      const league = await db.collection('league').findOne({ season: parseInt(season) });
      
      // Debug teams query issue
      const allTeams = await db.collection('teams').find({ season: parseInt(season) }).limit(3).toArray();
      
      return res.status(200).json({
        season: parseInt(season),
        counts: {
          teams: teamsCount,
          matchups: matchupsCount,
          league: leagueCount
        },
        samples: {
          team: sampleTeam ? { name: sampleTeam.name, espnId: sampleTeam.espnId, laLigaBucks: sampleTeam.laLigaBucks } : null,
          matchup: sampleMatchup ? { week: sampleMatchup.week, team1: sampleMatchup.team1?.name, team2: sampleMatchup.team2?.name } : null,
          league: league ? { name: league.name, currentWeek: league.currentWeek } : null
        },
        allTeamsPreview: allTeams.map(t => ({ name: t.name, espnId: t.espnId, season: t.season, laLigaBucks: t.laLigaBucks })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to check database',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = HealthController;