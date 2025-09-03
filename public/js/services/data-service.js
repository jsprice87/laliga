/**
 * Data Service
 * Handles all data operations, API calls, and data transformation
 */

import { Logger } from '../utils/logger.js';

export class DataService {
  constructor(apiClient, state) {
    this.api = apiClient;
    this.state = state;
    this.logger = new Logger('DataService');
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Team owner mapping tied to ESPN Team IDs
    // This ensures owner names persist even if team names change
    this.TEAM_OWNER_MAPPING = {
      // 2024 Team mappings using actual ESPN IDs from database
      // Format: espnTeamId: 'Owner Name'
      1: 'Jeff Parr',      // espnId: 1
      2: 'Scott Williams', // espnId: 2  
      3: 'Steve Parr',     // espnId: 3
      4: 'Matt George',    // espnId: 4
      5: 'Adam Haywood',   // espnId: 5
      8: 'Justin Price',   // espnId: 8
      10: 'Evan Lengrich', // espnId: 10
      11: 'Eric Butler',   // espnId: 11
      12: 'Matt Kelsall',  // espnId: 12
      13: 'Nik Markley',   // espnId: 13
      14: 'Boston Weir',   // espnId: 14
      15: 'Kris McKissack' // espnId: 15
    };
  }

  /**
   * Load live data for current season
   */
  async loadLiveData(year = 2025) {
    const cacheKey = `live-${year}`;
    
    try {
      this.logger.info(`Loading live data for ${year}`);
      
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached live data');
        return cached;
      }

      // Load from API with enhanced error handling
      const data = await this.makeReliableAPICall(
        () => this.api.getTeamsLive(1, year),
        'getTeamsLive',
        { year, week: 1 }
      );
      
      // Handle both wrapped and unwrapped API responses
      if (data && Array.isArray(data)) {
        // Direct teams array from API
        const processedData = this.processLiveData({ teams: data });
        this.setCachedData(cacheKey, processedData);
        return processedData;
      } else if (data && (data.status === 'success' || data.teams)) {
        // Wrapped response format
        const processedData = this.processLiveData(data);
        this.setCachedData(cacheKey, processedData);
        return processedData;
      }
      
      // If no data or countdown status, return null for 2025
      if (year === 2025) {
        this.logger.info('No live data for 2025, season not started');
        return null;
      }
      
      throw new Error('No live data available');
      
    } catch (error) {
      this.logger.error(`Failed to load live data for ${year}:`, error);
      
      // For 2025, this is expected (season not started)
      if (year === 2025) {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Load historical data for previous seasons
   */
  async loadHistoricalData(year) {
    const cacheKey = `historical-${year}`;
    
    try {
      console.log('=== ENTERING loadHistoricalData for year:', year);
      this.logger.info(`Loading historical data for ${year}`);
      
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log('🔍 DEBUG: Returning cached data with teams:', cached.teams?.slice(0, 2).map(t => ({ 
          name: t.name, 
          owner: t.owner, 
          id: t.id,
          laLigaBucks: t.laLigaBucks 
        })));
        this.logger.debug('Returning cached historical data');
        return cached;
      }

      // Load from API with enhanced error handling
      const data = await this.makeReliableAPICall(
        () => this.api.getTeamsHistorical(year),
        'getTeamsHistorical',
        { year }
      );
      
      console.log('🔍 LIGA BUCKS DEBUG - Raw API response for', year, ':', data);
      console.log('🔍 LIGA BUCKS DEBUG - Response type:', typeof data, 'Is array:', Array.isArray(data), 'Length:', data?.length);
      
      // Check if data has teams array with Liga Bucks
      if (data && data.teams) {
        console.log('🔍 LIGA BUCKS DEBUG - First team from data.teams:', data.teams[0]);
        console.log('🔍 LIGA BUCKS DEBUG - First team Liga Bucks:', data.teams[0]?.laLigaBucks);
      }
      
      // Check if this is the new API format from weekly_standings (has metadata.dataSource)
      if (data && data.metadata && data.metadata.dataSource && data.metadata.dataSource.source === 'weekly_standings') {
        console.log('✅ LIGA BUCKS - Received pre-processed weekly_standings data, no further processing needed');
        console.log('✅ LIGA BUCKS - First team:', data.teams[0]?.name, 'Liga Bucks:', data.teams[0]?.laLigaBucks);
        
        // Return the data as-is since it's already properly processed from the database
        const processedData = {
          teams: data.teams, // Use teams as-is, they're already correctly processed
          matchups: [],
          currentWeek: data.metadata.week || 14,
          seasonStatus: 'complete'
        };
        this.setCachedData(cacheKey, processedData);
        return processedData;
      }
      
      // Handle both wrapped and unwrapped API responses (legacy format)
      if (data && Array.isArray(data)) {
        console.log('Processing direct teams array, first team:', data[0]?.name);
        // Direct teams array from API - use simplified processing to avoid circular references
        const processedTeams = data.map(team => {
          const teamId = team.espnId || team.id;
          
          // DEBUG: Log Liga Bucks processing
          console.log('🏈 LIGA BUCKS PROCESSING:', {
            teamName: team.name,
            teamId: teamId,
            rawLigaBucks: team.laLigaBucks,
            rawEspnComponent: team.espnComponent,
            rawCumulativeComponent: team.cumulativeComponent,
            laLigaBucksType: typeof team.laLigaBucks
          });
          
          const ownerName = this.TEAM_OWNER_MAPPING[teamId] || team.owner || `Team ${teamId} Owner`;
          
          // Check if Liga Bucks need to be calculated (empty object or missing total)
          let laLigaBucks, espnComponent, cumulativeComponent;
          
          if (team.laLigaBucks && team.laLigaBucks.total && team.laLigaBucks.espnComponent !== undefined) {
            // Use existing Liga Bucks
            laLigaBucks = team.laLigaBucks.total;
            espnComponent = team.laLigaBucks.espnComponent;
            cumulativeComponent = team.laLigaBucks.cumulativeComponent;
            console.log('✅ Using existing Liga Bucks for', team.name, ':', laLigaBucks);
          } else {
            // Calculate Liga Bucks for historical data with empty objects
            console.log('🔄 Calculating Liga Bucks for historical team:', team.name);
            espnComponent = this.calculateESPNComponent(team);
            cumulativeComponent = this.calculateCumulativeComponent(team);
            laLigaBucks = espnComponent + cumulativeComponent;
            console.log('📊 Calculated Liga Bucks for', team.name, ':', { espnComponent, cumulativeComponent, laLigaBucks });
          }
          
          const processedTeam = {
            id: teamId,
            name: team.name,
            owner: ownerName,
            abbrev: team.abbrev,
            logo: team.logo,
            record: team.record,
            totalPoints: team.totalPoints,
            espnRank: team.espnRank,
            playoffSeed: team.playoffSeed,
            laLigaBucks: laLigaBucks,
            espnComponent: espnComponent,
            cumulativeComponent: cumulativeComponent,
            weeklyAverageComponent: 0, // Not used in current calculation system
            earnings: team.earnings || 0,
            weeklyHighScores: team.weeklyHighScores || 0
          };
          
          console.log('💰 FINAL PROCESSED TEAM:', {
            name: processedTeam.name,
            laLigaBucks: processedTeam.laLigaBucks,
            espnComponent: processedTeam.espnComponent,
            cumulativeComponent: processedTeam.cumulativeComponent
          });
          
          return processedTeam;
        });
        
        const processedData = {
          teams: processedTeams,
          matchups: [],
          currentWeek: 17,
          seasonStatus: 'complete'
        };
        this.setCachedData(cacheKey, processedData);
        return processedData;
      } else if (data && (data.status === 'success' || data.teams)) {
        console.log('Processing wrapped response format');
        // Wrapped response format
        const processedData = this.processHistoricalData(data);
        this.setCachedData(cacheKey, processedData);
        return processedData;
      }
      
      console.error('No valid data format found, data:', data);
      throw new Error('No historical data available');
      
    } catch (error) {
      this.logger.error(`Failed to load historical data for ${year}:`, error);
      throw error;
    }
  }

  /**
   * Load matchups data
   */
  async loadMatchups(week, year) {
    const cacheKey = `matchups-${year}-${week}`;
    
    try {
      console.group(`📊 DATA SERVICE - Loading matchups for week ${week}, year ${year}`);
      this.logger.info(`Loading matchups for week ${week}, year ${year}`);
      
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log(`Found cached matchups:`, cached);
        console.groupEnd();
        return cached;
      }

      // Load from API with enhanced error handling
      console.log(`Making API call to getMatchups(${week}, ${year})`);
      const data = await this.makeReliableAPICall(
        () => this.api.getMatchups(week, year),
        'getMatchups',
        { week, year }
      );
      
      console.log(`Raw API response:`, data);
      
      if (data && (data.status === 'success' || data.matchups)) {
        const processedData = this.processMatchupsData(data);
        console.log(`Processed matchups data:`, processedData);
        console.groupEnd();
        this.setCachedData(cacheKey, processedData);
        return processedData;
      }
      
      console.log(`❌ No valid matchups data found for week ${week}, year ${year}`);
      console.groupEnd();
      // Return empty array if no matchups
      return [];
      
    } catch (error) {
      console.error(`❌ Error loading matchups for week ${week}, year ${year}:`, error);
      console.groupEnd();
      this.logger.error(`Failed to load matchups for week ${week}, year ${year}:`, error);
      return [];
    }
  }

  /**
   * Load all matchups for a season
   */
  async loadAllMatchups(year) {
    const cacheKey = `all-matchups-${year}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Load from API
      const data = await this.api.getAllMatchups(year);
      
      if (data && (data.status === 'success' || data.matchups)) {
        const processedData = this.processAllMatchupsData(data);
        this.setCachedData(cacheKey, processedData);
        return processedData;
      }
      
      return [];
      
    } catch (error) {
      this.logger.error(`Failed to load all matchups for ${year}:`, error);
      return [];
    }
  }

  /**
   * Load champions and sacko history
   */
  async loadHistory() {
    try {
      const [championsData, sackosData] = await Promise.all([
        this.api.getChampions(),
        this.api.getSackos()
      ]);

      const champions = championsData?.champions || [];
      const sackos = sackosData?.sackos || [];

      return { champions, sackos };
      
    } catch (error) {
      this.logger.error('Failed to load history:', error);
      return { champions: [], sackos: [] };
    }
  }

  /**
   * Load commentary data
   */
  async loadCommentary() {
    try {
      const data = await this.api.getCommentary();
      return data?.commentary || [];
      
    } catch (error) {
      this.logger.error('Failed to load commentary:', error);
      return [];
    }
  }

  /**
   * Process live data from API
   */
  processLiveData(data) {
    const teams = data.teams || [];
    const processedTeams = teams.map(team => this.processTeamData(team));
    
    return {
      teams: processedTeams,
      matchups: data.matchups || [],
      currentWeek: data.currentWeek || 1,
      seasonStatus: data.seasonStatus || 'active'
    };
  }

  /**
   * Process historical data from API
   */
  processHistoricalData(data) {
    const teams = data.teams || [];
    const processedTeams = teams.map(team => this.processTeamData(team));
    
    return {
      teams: processedTeams,
      matchups: data.matchups || [],
      currentWeek: data.currentWeek || 17,
      seasonStatus: 'complete'
    };
  }

  /**
   * Process team data with calculations
   */
  processTeamData(team) {
    // Use Liga Bucks data from API if available, otherwise calculate
    let espnComponent, cumulativeComponent, weeklyAverageComponent, totalLaLigaBucks;
    
    // Add logging to debug the issue
    console.log('Processing team:', team.name, 'Has laLigaBucks:', !!team.laLigaBucks, 'Type:', typeof team.laLigaBucks);
    
    if (team.laLigaBucks && typeof team.laLigaBucks === 'object') {
      // Use API-provided Liga Bucks values (2 components only)
      espnComponent = team.laLigaBucks.espnComponent || 0;
      cumulativeComponent = team.laLigaBucks.cumulativeComponent || 0;
      weeklyAverageComponent = 0; // Removed per PRD
      totalLaLigaBucks = team.laLigaBucks.total || (espnComponent + cumulativeComponent);
      console.log('Using API Liga Bucks for', team.name, ':', { espnComponent, cumulativeComponent, totalLaLigaBucks });
    } else {
      // Calculate La Liga Bucks components if not provided by API (2 components only)
      espnComponent = this.calculateESPNComponent(team);
      cumulativeComponent = this.calculateCumulativeComponent(team);
      weeklyAverageComponent = 0; // Removed per PRD
      totalLaLigaBucks = espnComponent + cumulativeComponent;
      console.log('Calculated Liga Bucks for', team.name, ':', { espnComponent, cumulativeComponent, totalLaLigaBucks });
    }
    
    // Get team ID for owner mapping
    const teamId = team.id || team.espnId || team.teamId;
    
    // DEBUG: Log team ID and owner info
    console.log('🔍 Team ID Debug:', {
      teamName: team.name,
      teamId: teamId,
      teamIdType: typeof teamId,
      rawOwner: team.owner,
      rawOwnerName: team.ownerName,
      mappingResult: this.TEAM_OWNER_MAPPING[teamId],
      mappingKeys: Object.keys(this.TEAM_OWNER_MAPPING)
    });
    
    // Use hardcoded owner mapping first, then fallback to API data
    const ownerName = this.TEAM_OWNER_MAPPING[teamId] || team.owner || team.ownerName || `Team ${teamId} Owner`;
    
    return {
      // Core team identification
      id: teamId,
      name: team.name || team.teamName || 'Unknown Team',
      owner: ownerName,
      abbrev: team.abbrev || team.abbreviation || '',
      logo: team.logo || team.logoUrl || '',
      
      // Season statistics
      record: team.record || { wins: 0, losses: 0, ties: 0 },
      totalPoints: team.totalPoints || team.points || 0,
      espnRank: team.espnRank || team.rank || 0,
      playoffSeed: team.playoffSeed || team.seed || 0,
      
      // Liga Bucks components
      espnComponent,
      cumulativeComponent,
      weeklyAverageComponent,
      laLigaBucks: totalLaLigaBucks,
      
      // Money tracking
      earnings: team.earnings || 0,
      weeklyHighScores: team.weeklyHighScores || 0
    };
  }

  /**
   * Calculate ESPN component (1-12 points based on ESPN ranking)
   */
  calculateESPNComponent(team) {
    const rank = team.espnRank || team.rank || 12;
    return Math.max(1, Math.min(12, 13 - rank));
  }

  /**
   * Calculate cumulative component (1-12 points based on total points ranking)
   */
  calculateCumulativeComponent(team) {
    // This requires comparison with other teams, so it's calculated elsewhere
    return team.cumulativeComponent || 0;
  }

  /**
   * Calculate weekly average component (1-12 points based on weekly average ranking)
   */
  calculateWeeklyAverageComponent(team) {
    // This requires comparison with other teams, so it's calculated elsewhere
    return team.weeklyAverageComponent || 0;
  }

  /**
   * Process matchups data
   */
  processMatchupsData(data) {
    console.log('Processing matchups data:', data);
    const matchups = data.matchups || [];
    
    const processedMatchups = matchups.map(matchup => {
      console.log('Processing individual matchup:', matchup);
      
      const processed = {
        ...matchup,
        id: matchup.id || `${matchup.week}-${matchup.team1?.id}-${matchup.team2?.id}`,
        week: matchup.week || 1,
        team1: {
          ...matchup.team1,
          // Extract score from different possible locations
          score: matchup.team1?.score || 0
        },
        team2: {
          ...matchup.team2,
          // Extract score from different possible locations  
          score: matchup.team2?.score || 0
        },
        // Also store scores at top level for backward compatibility
        team1Score: matchup.team1?.score || 0,
        team2Score: matchup.team2?.score || 0,
        status: matchup.status || 'scheduled'
      };
      
      console.log('Processed matchup:', processed);
      return processed;
    });
    
    console.log(`Processed ${processedMatchups.length} matchups`);
    return processedMatchups;
  }

  /**
   * Process all matchups data
   */
  processAllMatchupsData(data) {
    const allMatchups = data.matchups || [];
    return allMatchups.map(matchup => this.processMatchupsData({ matchups: [matchup] })[0]);
  }

  /**
   * Calculate team rankings for all components
   * Preserves existing Liga Bucks calculations for historical data
   */
  calculateTeamRankings(teams) {
    if (!teams || teams.length === 0) {
      return teams;
    }

    // Check if this is historical data that already has Liga Bucks calculated
    const hasHistoricalLigaBucks = teams.some(team => 
      team.laLigaBucks > 0 && team.espnComponent > 0 && team.cumulativeComponent > 0
    );
    
    if (hasHistoricalLigaBucks) {
      console.log('🔒 Preserving historical Liga Bucks calculations');
      // For historical data, preserve existing calculations and just compute rankings
      const ligaBucksSorted = [...teams].sort((a, b) => {
        const bucksA = a.laLigaBucks || 0;
        const bucksB = b.laLigaBucks || 0;
        
        // Primary sort: La Liga Bucks (descending)
        if (bucksA !== bucksB) {
          return bucksB - bucksA;
        }
        
        // Tiebreaker: Points Against (ascending - higher points against = worse)
        const pointsAgainstA = a.pointsAgainst || 0;
        const pointsAgainstB = b.pointsAgainst || 0;
        return pointsAgainstA - pointsAgainstB;
      });
      
      // Assign final Liga Bucks ranks (1-12) without ties
      ligaBucksSorted.forEach((team, index) => {
        team.ligaBucksRank = index + 1;
      });
      
      return teams;
    }

    // For live/current data, calculate Liga Bucks components
    console.log('🔄 Calculating Liga Bucks for live/current data');
    
    // ESPN Component (based on ESPN rank)
    teams.forEach(team => {
      team.espnComponent = this.calculateESPNComponent(team);
    });

    // Cumulative Component (based on total points with Points Against tiebreaker)
    const pointsSorted = [...teams].sort((a, b) => {
      const pointsA = a.totalPoints || 0;
      const pointsB = b.totalPoints || 0;
      
      // Primary sort: Total Points (descending)
      if (pointsA !== pointsB) {
        return pointsB - pointsA;
      }
      
      // Tiebreaker: Points Against (ascending - higher points against = worse)
      const pointsAgainstA = a.pointsAgainst || 0;
      const pointsAgainstB = b.pointsAgainst || 0;
      return pointsAgainstA - pointsAgainstB;
    });
    
    // Assign ranks (1-12) without ties
    pointsSorted.forEach((team, index) => {
      team.cumulativeComponent = Math.max(1, 12 - index);
      team.ligaBucksRank = index + 1; // Store actual rank for progression chart
    });

    // Remove weekly average component - PRD specifies only 2 components (50% ESPN + 50% Points)
    teams.forEach(team => {
      team.weeklyAverageComponent = 0; // Set to 0 for backward compatibility
    });

    // Calculate total La Liga Bucks (2 components only)
    teams.forEach(team => {
      team.laLigaBucks = (team.espnComponent || 0) + (team.cumulativeComponent || 0);
    });

    // Calculate final Liga Bucks rankings with tiebreaker
    const ligaBucksSorted = [...teams].sort((a, b) => {
      const bucksA = a.laLigaBucks || 0;
      const bucksB = b.laLigaBucks || 0;
      
      // Primary sort: La Liga Bucks (descending)
      if (bucksA !== bucksB) {
        return bucksB - bucksA;
      }
      
      // Tiebreaker: Points Against (ascending - higher points against = worse)
      const pointsAgainstA = a.pointsAgainst || 0;
      const pointsAgainstB = b.pointsAgainst || 0;
      return pointsAgainstA - pointsAgainstB;
    });
    
    // Assign final Liga Bucks ranks (1-12) without ties
    ligaBucksSorted.forEach((team, index) => {
      team.ligaBucksRank = index + 1;
    });

    return teams;
  }

  /**
   * Get cached data
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('Data cache cleared');
  }

  /**
   * Force refresh data (bypass cache)
   */
  async forceRefresh(year) {
    this.clearCache();
    
    if (year === 2025) {
      return await this.loadLiveData(year);
    } else {
      return await this.loadHistoricalData(year);
    }
  }

  /**
   * Get team details
   */
  async getTeamDetails(teamId, year) {
    try {
      const data = await this.api.getTeamDetails(teamId, year);
      return data?.team || null;
      
    } catch (error) {
      this.logger.error(`Failed to load team details for ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Get team progression data
   */
  async getTeamProgression(teamId, year) {
    try {
      const data = await this.api.getTeamProgression(teamId, year);
      return data?.progression || [];
      
    } catch (error) {
      this.logger.error(`Failed to load team progression for ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get earnings data
   */
  async getEarnings(year) {
    try {
      const data = await this.api.getEarnings(year);
      return data?.earnings || [];
      
    } catch (error) {
      this.logger.error(`Failed to load earnings for ${year}:`, error);
      return [];
    }
  }

  /**
   * Get weekly high scores
   */
  async getWeeklyHighScores(year) {
    try {
      const data = await this.api.getWeeklyHighScores(year);
      return data?.highScores || [];
      
    } catch (error) {
      this.logger.error(`Failed to load weekly high scores for ${year}:`, error);
      return [];
    }
  }

  /**
   * Calculate money statistics
   */
  calculateMoneyStats(teams, earnings = []) {
    const totalPaid = earnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);
    const prizePool = this.state.getLeague().prizePool;
    
    return {
      totalPool: prizePool,
      totalPaid,
      remaining: prizePool - totalPaid,
      weeklyBonus: this.state.getLeague().weeklyBonus,
      earnings
    };
  }

  /**
   * Generate empty data for new season
   */
  generateEmptySeasonData() {
    const teamNames = [
      "Kris P. Roni", "Blondes Give Me A Chubb", "Team Epsilon", 
      "Murican Futball Crusaders", "Blue Line", "Purple Reign",
      "Hurts in the Brown Bachs", "The Peeping Tomlins", "CTE Ain't Nothing",
      "Nothing to CTE Here", "Vonnies Chubbies", "Fire My Cannons"
    ];
    
    const teams = teamNames.map((name, index) => ({
      id: index + 1,
      name: name,
      owner: "TBD",
      record: { wins: 0, losses: 0, ties: 0 },
      totalPoints: 0,
      espnRank: index + 1,
      playoffSeed: index + 1,
      laLigaBucks: 0,
      espnComponent: 0,
      cumulativeComponent: 0,
      weeklyAverageComponent: 0,
      earnings: 0,
      weeklyHighScores: 0
    }));

    return {
      teams,
      matchups: [],
      currentWeek: 1,
      seasonStatus: 'pre-season'
    };
  }

  /**
   * Make reliable API call with enhanced error handling
   * @param {Function} apiCall - API call function to execute
   * @param {string} operation - Name of the operation for logging
   * @param {Object} context - Context information for debugging
   * @returns {Promise<any>} API response
   */
  async makeReliableAPICall(apiCall, operation, context = {}) {
    const maxRetries = 3;
    const baseDelay = 1000;
    const retryableErrors = [500, 502, 503, 504, 429];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`${operation} attempt ${attempt}/${maxRetries}`, context);
        const result = await apiCall();
        
        if (attempt > 1) {
          this.logger.info(`${operation} succeeded after ${attempt} attempts`);
        }
        
        return result;
        
      } catch (error) {
        const isRetryable = this.isRetryableError(error, retryableErrors);
        const isLastAttempt = attempt === maxRetries;
        
        this.logger.warn(`${operation} attempt ${attempt}/${maxRetries} failed:`, {
          error: error.message,
          status: error.status,
          retryable: isRetryable,
          context
        });

        if (isLastAttempt || !isRetryable) {
          this.logger.error(`${operation} failed after ${attempt} attempts:`, error);
          throw this.enhanceDataServiceError(error, operation, context);
        }

        // Calculate delay with jitter
        const jitter = Math.random() * 0.3; // 0-30% jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) * (1 + jitter);
        
        this.logger.info(`Retrying ${operation} in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @param {Array} retryableStatusCodes - HTTP status codes that are retryable
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error, retryableStatusCodes) {
    // Network errors are generally retryable
    if (error.message?.includes('Network error') || error.message?.includes('fetch')) {
      return true;
    }
    
    // Timeout errors are retryable
    if (error.message?.includes('timeout') || error.name === 'AbortError') {
      return true;
    }
    
    // Check HTTP status codes
    if (error.status && retryableStatusCodes.includes(error.status)) {
      return true;
    }
    
    // Client errors (4xx) are generally not retryable, except 429 (rate limiting)
    if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }
    
    return true; // Default to retryable for unknown errors
  }

  /**
   * Enhance error with DataService context
   * @param {Error} error - Original error
   * @param {string} operation - Operation name
   * @param {Object} context - Additional context
   * @returns {Error} Enhanced error
   */
  enhanceDataServiceError(error, operation, context) {
    const enhancedError = new Error(`DataService ${operation} failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.operation = operation;
    enhancedError.context = context;
    enhancedError.timestamp = new Date().toISOString();
    enhancedError.status = error.status;
    enhancedError.userMessage = this.getUserFriendlyErrorMessage(error, operation);
    
    return enhancedError;
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - Original error
   * @param {string} operation - Operation name
   * @returns {string} User-friendly message
   */
  getUserFriendlyErrorMessage(error, operation) {
    if (error.message?.includes('timeout')) {
      return 'Request is taking too long. Please try again.';
    }
    
    if (error.message?.includes('Network error')) {
      return 'Connection problem. Please check your internet and try again.';
    }
    
    if (error.status === 404) {
      return 'The requested data is not available.';
    }
    
    if (error.status >= 500) {
      return 'Server is experiencing issues. Please try again in a few minutes.';
    }
    
    if (operation === 'getTeamsLive') {
      return 'Unable to load current team data. Trying cached data...';
    }
    
    if (operation === 'getTeamsHistorical') {
      return 'Unable to load historical team data.';
    }
    
    return 'Something went wrong loading data. Please try again.';
  }
}