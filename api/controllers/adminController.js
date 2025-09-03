/**
 * Admin Controller - Administrative operations and data management
 * Handles season data ingestion, database management, and administrative tasks
 */

const { fetchESPNTeams } = require('../espn/fetchTeams');
const { fetchESPNMatchups } = require('../espn/fetchMatchups');
const { fetchESPNLeague } = require('../espn/fetchLeague');
const { updateWeeklyData, updateCurrentWeek } = require('../laliga/updateWeekly');
const { saveTeams, saveMatchups, saveLeague } = require('../database/schemas');
const { connectToMongoDB } = require('../database/connect');
const { transformESPNMatchups } = require('../utils/transformMatchups');
const { ingestCleanSeason } = require('../utils/cleanIngestion');

class AdminController {
  /**
   * Update weekly data or current week
   * POST /api/update?week=14&season=2025
   * POST /api/update?current=true
   */
  static async updateData(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const { week, current, season = 2025 } = Object.fromEntries(url.searchParams);
      
      if (current === 'true') {
        const result = await updateCurrentWeek();
        return res.status(200).json(result);
      } else if (week) {
        const weekNum = parseInt(week);
        
        // Validate week number
        if (weekNum < 1 || weekNum > 18) {
          return res.status(400).json({ error: 'Week must be between 1 and 18' });
        }
        
        const result = await updateWeeklyData(weekNum, season);
        return res.status(200).json(result);
      } else {
        return res.status(400).json({ error: 'Must specify week parameter or current=true' });
      }
    } catch (error) {
      console.error('❌ Update data error:', error.message);
      return res.status(500).json({
        error: 'Failed to update data',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clean season data ingestion
   * POST /api/clean-ingest/:season
   */
  static async cleanIngestSeason(req, res) {
    try {
      const season = parseInt(req.url.split('/')[3]);
      
      // Validate season
      const validation = AdminController.validateSeason(season);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid season',
          details: validation.errors 
        });
      }
      
      console.log(`🧹 Starting clean ingestion for season ${season}`);
      const result = await ingestCleanSeason(season);
      
      return res.status(200).json({
        message: `Season ${season} clean ingestion completed`,
        season: season,
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const season = req.url.split('/')[3];
      console.error(`❌ Clean ingestion failed for season ${season}:`, error.message);
      return res.status(500).json({
        error: `Clean ingestion failed for season ${season}`,
        details: error.message
      });
    }
  }

  /**
   * Full season data ingestion from ESPN API
   * POST /api/ingest-season/:season
   */
  static async ingestSeason(req, res) {
    try {
      const season = parseInt(req.url.split('/')[3]);
      
      // Validate season
      const validation = AdminController.validateSeason(season);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid season',
          details: validation.errors 
        });
      }
      
      console.log(`🔍 DEBUG: Ingesting complete season data for ${season}`);
      
      // Fetch and store league data
      const espnLeague = await fetchESPNLeague(process.env.ESPN_LEAGUE_ID, season);
      if (espnLeague) {
        await saveLeague(espnLeague, season);
        console.log(`✅ Stored league data for ${espnLeague.name} (${season})`);
      }
      
      // Fetch complete season data from ESPN API
      const espnTeams = await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season);
      console.log(`🔍 DEBUG: Fetched ${espnTeams?.length || 0} teams from ESPN for ${season}`);
      
      if (espnTeams && espnTeams.length > 0) {
        // Store teams in MongoDB
        await saveTeams(espnTeams, season);
        console.log(`✅ Stored ${espnTeams.length} teams in MongoDB for ${season}`);
      }
      
      // Fetch and store matchups for all weeks
      const allMatchups = [];
      for (let week = 1; week <= 17; week++) {
        try {
          const espnWeekMatchups = await fetchESPNMatchups(process.env.ESPN_LEAGUE_ID, season, week);
          if (espnWeekMatchups && espnWeekMatchups.length > 0) {
            // Transform ESPN format to our Matchup model format
            const transformedMatchups = await transformESPNMatchups(espnWeekMatchups, week, season);
            await saveMatchups(transformedMatchups, week, season);
            allMatchups.push(...transformedMatchups);
            console.log(`✅ Stored ${transformedMatchups.length} matchups for ${season} Week ${week}`);
          }
        } catch (weekError) {
          console.warn(`⚠️ Failed to fetch week ${week} for ${season}:`, weekError.message);
        }
      }
      
      return res.status(200).json({ 
        message: `Season ${season} data ingested successfully`,
        league: espnLeague?.name || 'Unknown',
        teams: espnTeams?.length || 0,
        matchups: allMatchups.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const season = req.url.split('/')[3];
      console.error(`❌ Failed to ingest season ${season}:`, error);
      return res.status(500).json({ 
        error: `Failed to ingest season ${season}: ${error.message}` 
      });
    }
  }

  /**
   * Clear data from MongoDB
   * POST /api/clear-data?season=2024  (specific season)
   * POST /api/clear-data               (all data)
   */
  static async clearData(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const { season } = Object.fromEntries(url.searchParams);
      
      const db = await connectToMongoDB();
      let result = {};
      
      if (season) {
        // Clear specific season
        const seasonNum = parseInt(season);
        
        // Validate season
        const validation = AdminController.validateSeason(seasonNum);
        if (!validation.isValid) {
          return res.status(400).json({ 
            error: 'Invalid season',
            details: validation.errors 
          });
        }
        
        result.teams = await db.collection('teams').deleteMany({ season: seasonNum });
        result.matchups = await db.collection('matchups').deleteMany({ season: seasonNum });
        result.league = await db.collection('league').deleteMany({ season: seasonNum });
        console.log(`🧹 Cleared season ${season}: ${result.teams.deletedCount} teams, ${result.matchups.deletedCount} matchups, ${result.league.deletedCount} league`);
      } else {
        // Clear all data - use with extreme caution
        result.teams = await db.collection('teams').deleteMany({});
        result.matchups = await db.collection('matchups').deleteMany({});
        result.league = await db.collection('league').deleteMany({});
        console.log(`🧹 Cleared all data: ${result.teams.deletedCount} teams, ${result.matchups.deletedCount} matchups, ${result.league.deletedCount} league`);
      }
      
      return res.status(200).json({
        message: season ? `Season ${season} data cleared` : 'All data cleared',
        deleted: {
          teams: result.teams.deletedCount,
          matchups: result.matchups.deletedCount,
          league: result.league.deletedCount
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to clear data:`, error.message);
      return res.status(500).json({
        error: 'Failed to clear data',
        details: error.message
      });
    }
  }

  /**
   * Validate season parameter
   * @param {number} season - Season year
   * @returns {Object} Validation result
   */
  static validateSeason(season) {
    const errors = [];

    if (!season || isNaN(season)) {
      errors.push('Season must be a valid number');
    } else if (season < 2020 || season > 2025) {
      errors.push('Season must be between 2020 and 2025');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = AdminController;