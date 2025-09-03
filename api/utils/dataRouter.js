/**
 * Data Router - Centralized routing for live vs historical data
 * Handles smart switching between ESPN API and MongoDB based on data requirements
 */

const { fetchESPNTeams } = require('../espn/fetchTeams');
const { fetchESPNMatchups } = require('../espn/fetchMatchups');
const { getTeams, getMatchups, getLeague } = require('../database/schemas');
const { ensureCurrentSeasonData } = require('./autoIngest');

class DataRouter {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.liveSeasons = [2025]; // Seasons that should use live data
    this.fallbackRetries = 3;
    this.fallbackDelay = 1000; // 1 second base delay
  }

  /**
   * Determine if a season should use live data
   * @param {number} season - Season year
   * @param {boolean} forceLive - Force live data regardless of season
   * @returns {boolean}
   */
  shouldUseLiveData(season, forceLive = false) {
    if (forceLive) return true;
    return this.liveSeasons.includes(parseInt(season));
  }

  /**
   * Get teams data with intelligent routing
   * @param {number} season - Season year
   * @param {number} week - Week number (optional)
   * @param {boolean} live - Force live data (optional)
   * @returns {Promise<Array>} Teams data
   */
  async getTeamsData(season, week = 14, live = null) {
    const useLive = live !== null ? live : this.shouldUseLiveData(season);
    
    console.log(`🔄 DataRouter: Getting teams data for ${season}, week ${week}, live: ${useLive}`);

    if (useLive) {
      return await this.getLiveTeamsData(season, week);
    } else {
      return await this.getHistoricalTeamsData(season);
    }
  }

  /**
   * Get live teams data with fallback
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @returns {Promise<Array>} Live teams data
   */
  async getLiveTeamsData(season, week) {
    try {
      console.log(`📡 DataRouter: Fetching live teams data for ${season}`);
      
      // Primary: ESPN API
      const teams = await this.retryWithFallback(
        () => fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season, week),
        'ESPN teams API'
      );

      if (teams && teams.length > 0) {
        console.log(`✅ DataRouter: Got ${teams.length} teams from ESPN API`);
        return teams;
      }

      throw new Error('No teams data from ESPN API');

    } catch (error) {
      console.warn(`⚠️ DataRouter: ESPN API failed for teams (${season}), falling back to cache:`, error.message);
      return await this.getHistoricalTeamsData(season);
    }
  }

  /**
   * Get historical teams data from cache
   * @param {number} season - Season year
   * @returns {Promise<Array>} Historical teams data
   */
  async getHistoricalTeamsData(season) {
    try {
      console.log(`💾 DataRouter: Fetching cached teams data for ${season}`);
      
      // Ensure data exists in cache
      await ensureCurrentSeasonData(season);
      
      const teams = await getTeams(season);
      
      if (teams && teams.length > 0) {
        console.log(`✅ DataRouter: Got ${teams.length} teams from MongoDB cache`);
        return teams;
      }

      console.warn(`⚠️ DataRouter: No cached data for ${season}, attempting live fetch`);
      return await this.getLiveTeamsData(season, 14);

    } catch (error) {
      console.error(`❌ DataRouter: Failed to get historical teams data for ${season}:`, error.message);
      throw new Error(`Unable to retrieve teams data for ${season}: ${error.message}`);
    }
  }

  /**
   * Get matchups data with intelligent routing
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @param {boolean} live - Force live data (optional)
   * @returns {Promise<Array>} Matchups data
   */
  async getMatchupsData(season, week, live = null) {
    const useLive = live !== null ? live : this.shouldUseLiveData(season) && this.isCurrentWeek(season, week);
    
    console.log(`🔄 DataRouter: Getting matchups data for ${season} week ${week}, live: ${useLive}`);

    if (useLive) {
      return await this.getLiveMatchupsData(season, week);
    } else {
      return await this.getHistoricalMatchupsData(season, week);
    }
  }

  /**
   * Get live matchups data with fallback
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @returns {Promise<Array>} Live matchups data
   */
  async getLiveMatchupsData(season, week) {
    try {
      console.log(`📡 DataRouter: Fetching live matchups data for ${season} week ${week}`);
      
      const matchups = await this.retryWithFallback(
        () => fetchESPNMatchups(process.env.ESPN_LEAGUE_ID, season, week),
        'ESPN matchups API'
      );

      if (matchups && matchups.length > 0) {
        console.log(`✅ DataRouter: Got ${matchups.length} matchups from ESPN API`);
        return matchups;
      }

      throw new Error('No matchups data from ESPN API');

    } catch (error) {
      console.warn(`⚠️ DataRouter: ESPN API failed for matchups (${season} week ${week}), falling back to cache:`, error.message);
      return await this.getHistoricalMatchupsData(season, week);
    }
  }

  /**
   * Get historical matchups data from cache
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @returns {Promise<Array>} Historical matchups data
   */
  async getHistoricalMatchupsData(season, week) {
    try {
      console.log(`💾 DataRouter: Fetching cached matchups data for ${season} week ${week}`);
      
      // Ensure data exists in cache
      await ensureCurrentSeasonData(season);
      
      const matchups = await getMatchups(week, season);
      
      if (matchups && matchups.length > 0) {
        console.log(`✅ DataRouter: Got ${matchups.length} matchups from MongoDB cache`);
        return matchups;
      }

      console.warn(`⚠️ DataRouter: No cached matchups for ${season} week ${week}, attempting live fetch`);
      return await this.getLiveMatchupsData(season, week);

    } catch (error) {
      console.error(`❌ DataRouter: Failed to get historical matchups data for ${season} week ${week}:`, error.message);
      throw new Error(`Unable to retrieve matchups data for ${season} week ${week}: ${error.message}`);
    }
  }

  /**
   * Get league data with intelligent routing
   * @param {number} season - Season year
   * @returns {Promise<Object>} League data
   */
  async getLeagueData(season) {
    try {
      console.log(`🔄 DataRouter: Getting league data for ${season}`);
      
      // Always try cache first for league metadata
      const leagueData = await getLeague(season);
      
      if (leagueData) {
        console.log(`✅ DataRouter: Got league data from MongoDB cache`);
        return leagueData;
      }

      // If no cache, ensure data is ingested
      await ensureCurrentSeasonData(season);
      return await getLeague(season);

    } catch (error) {
      console.error(`❌ DataRouter: Failed to get league data for ${season}:`, error.message);
      throw new Error(`Unable to retrieve league data for ${season}: ${error.message}`);
    }
  }

  /**
   * Determine data source status for UI indicators
   * @param {number} season - Season year
   * @param {number} week - Week number (optional)
   * @returns {Object} Data source status
   */
  getDataSourceStatus(season, week = null) {
    const isLiveSeason = this.shouldUseLiveData(season);
    const isCurrentWeek = week ? this.isCurrentWeek(season, week) : true;
    const isLive = isLiveSeason && isCurrentWeek;

    return {
      source: isLive ? 'espn' : 'cache',
      status: isLive ? 'LIVE' : 'FINAL',
      lastUpdated: isLive ? new Date().toISOString() : null,
      season: season,
      week: week,
      refreshable: isLive
    };
  }

  /**
   * Check if a week is the current active week
   * @param {number} season - Season year
   * @param {number} week - Week number
   * @returns {boolean}
   */
  isCurrentWeek(season, week) {
    // For 2025, season hasn't started yet
    if (season >= 2025) {
      return week === 1;
    }

    // For historical seasons, no weeks are "current"
    if (season < this.currentYear) {
      return false;
    }

    // For current season, determine current week based on date
    // This is a simplified implementation - in production, you'd calculate based on NFL schedule
    const now = new Date();
    const seasonStart = new Date(season, 8, 1); // September 1st
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
    
    return week === Math.min(Math.max(weeksSinceStart, 1), 17);
  }

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {string} context - Context for logging
   * @returns {Promise<any>} Result of function
   */
  async retryWithFallback(fn, context = '') {
    for (let attempt = 1; attempt <= this.fallbackRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.warn(`⚠️ DataRouter: ${context} attempt ${attempt}/${this.fallbackRetries} failed:`, error.message);
        
        if (attempt === this.fallbackRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = this.fallbackDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Force refresh of cached data
   * @param {number} season - Season year
   * @returns {Promise<boolean>} Success status
   */
  async forceRefresh(season) {
    try {
      console.log(`🔄 DataRouter: Force refreshing data for ${season}`);
      
      // Force re-ingestion of current season data
      await ensureCurrentSeasonData(season, true);
      
      console.log(`✅ DataRouter: Successfully refreshed data for ${season}`);
      return true;
      
    } catch (error) {
      console.error(`❌ DataRouter: Failed to refresh data for ${season}:`, error.message);
      return false;
    }
  }

  /**
   * Health check for data sources
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      espnApi: 'unknown',
      mongoDb: 'unknown',
      overall: 'degraded'
    };

    // Test ESPN API
    try {
      await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, 2024, 14);
      health.espnApi = 'healthy';
    } catch (error) {
      health.espnApi = 'unhealthy';
    }

    // Test MongoDB
    try {
      await getLeague(2024);
      health.mongoDb = 'healthy';
    } catch (error) {
      health.mongoDb = 'unhealthy';
    }

    // Overall health
    if (health.espnApi === 'healthy' && health.mongoDb === 'healthy') {
      health.overall = 'healthy';
    } else if (health.espnApi === 'unhealthy' && health.mongoDb === 'unhealthy') {
      health.overall = 'critical';
    }

    return health;
  }
}

// Export singleton instance
const dataRouter = new DataRouter();

module.exports = {
  DataRouter,
  dataRouter,
  getTeamsData: (season, week, live) => dataRouter.getTeamsData(season, week, live),
  getMatchupsData: (season, week, live) => dataRouter.getMatchupsData(season, week, live),
  getLeagueData: (season) => dataRouter.getLeagueData(season),
  getDataSourceStatus: (season, week) => dataRouter.getDataSourceStatus(season, week),
  forceRefresh: (season) => dataRouter.forceRefresh(season),
  healthCheck: () => dataRouter.healthCheck()
};