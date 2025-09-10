/**
 * Matchups Controller - Fantasy football matchups and scheduling
 * Handles weekly matchups, head-to-head results, and scheduling data
 */

const { getMatchupsData, getDataSourceStatus } = require('../utils/dataRouter');
const { getWeeklyMatchups } = require('../laliga/calculateLigaBucks');

class MatchupsController {
  /**
   * Get matchups for a specific week and season
   * GET /api/matchups?week=14&season=2025
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMatchups(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const { week = 14, season = 2025, live } = Object.fromEntries(url.searchParams);
      
      const parsedSeason = parseInt(season);
      const parsedWeek = parseInt(week);
      const useLive = live === 'true';
      
      // Validate parameters
      const validation = MatchupsController.validateMatchupsParams({ week: parsedWeek, season: parsedSeason });
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid parameters',
          details: validation.errors 
        });
      }
      
      console.log(`🎯 MatchupsController: Getting matchups for season ${parsedSeason}, week ${parsedWeek}, live: ${useLive}`);
      
      // 2025 season is now LIVE! 🏈 
      console.log(`🏈 LIVE 2025 MATCHUPS ACTIVE - Getting live data for week ${parsedWeek}`);
      
      // Use DataRouter to get matchups data with intelligent routing
      const matchups = await getMatchupsData(parsedSeason, parsedWeek, useLive);
      
      if (!matchups || matchups.length === 0) {
        console.warn(`⚠️ MatchupsController: No matchups data found for season ${parsedSeason}, week ${parsedWeek}`);
        return res.status(404).json({
          error: 'No matchups data available',
          season: parsedSeason,
          week: parsedWeek,
          timestamp: new Date().toISOString()
        });
      }
      
      // Get data source status for response metadata
      const sourceStatus = getDataSourceStatus(parsedSeason, parsedWeek);
      
      console.log(`✅ MatchupsController: Returning ${matchups.length} matchups from ${sourceStatus.source}`);
      
      return res.status(200).json({
        matchups: matchups,
        metadata: {
          season: parsedSeason,
          week: parsedWeek,
          count: matchups.length,
          dataSource: sourceStatus,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ MatchupsController error:', error.message);
      return res.status(500).json({ 
        error: 'Failed to fetch matchups data',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate request parameters for matchups endpoint
   * @param {Object} params - Request parameters
   * @returns {Object} Validation result
   */
  static validateMatchupsParams(params) {
    const { week, season } = params;
    const errors = [];

    if (week && (isNaN(week) || week < 1 || week > 18)) {
      errors.push('Week must be between 1 and 18');
    }

    if (season && (isNaN(season) || season < 2020 || season > 2025)) {
      errors.push('Season must be between 2020 and 2025');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = MatchupsController;