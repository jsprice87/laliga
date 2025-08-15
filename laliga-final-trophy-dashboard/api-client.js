// API Client for La Liga del Fuego Dashboard
'use strict';

/********************
 * API Configuration *
 ********************/
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3001/api', // Development API server
    pollInterval: 60000 // 1 minute for development
  },
  production: {
    baseUrl: '/api', 
    pollInterval: 300000 // 5 minutes for production
  }
};

// Determine environment
const environment = window.location.hostname === 'localhost' ? 'development' : 'production';
const config = API_CONFIG[environment];

/********************
 * API Client Class *
 ********************/
class LaLigaAPI {
  constructor() {
    this.baseUrl = config.baseUrl;
    this.cache = new Map();
    this.lastFetch = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  // Generic fetch with error handling and caching
  async fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = url + JSON.stringify(options);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheDuration) {
        return data;
      }
    }

    try {
      const response = await window.fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful responses
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('API fetch error:', error);
      
      // Return cached data if available, even if expired
      if (this.cache.has(cacheKey)) {
        console.warn('Using cached data due to API error');
        return this.cache.get(cacheKey).data;
      }
      
      throw error;
    }
  }

  // Get teams data (live from ESPN)
  async getTeamsLive(week = 14, season = 2025) {
    return this.fetch(`/teams?live=true&week=${week}&season=${season}`);
  }

  // Get teams data (cached from database)
  async getTeams(season = 2025) {
    return this.fetch(`/teams?season=${season}`);
  }

  // Get matchups for a specific week
  async getMatchups(week = 14, season = 2025) {
    return this.fetch(`/matchups?week=${week}&season=${season}`);
  }

  // Update weekly data
  async updateWeeklyData(week, season = 2025) {
    return this.fetch(`/update/${week}?season=${season}`, {
      method: 'POST'
    });
  }

  // Ingest complete season data from ESPN API into MongoDB
  async ingestSeasonData(season) {
    console.log(`🔍 DEBUG: Triggering ESPN data ingestion for season ${season}`);
    return this.fetch(`/ingest-season/${season}`, {
      method: 'POST'
    });
  }

  // Health check
  async healthCheck() {
    return this.fetch('/health');
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.lastFetch.clear();
  }

  // Transform ESPN data to dashboard format
  transformTeamData(espnTeams) {
    return espnTeams.map(team => ({
      id: team.id || team.espnId,
      name: team.name,
      owner: this.getOwnerName(team.primaryOwner || team.owner),
      record: this.formatRecord(team.record?.overall),
      totalPoints: Math.round(team.points * 10) / 10,
      laLigaBucks: team.laLigaBucks?.total || 0,
      weeklyHighScores: 0, // Would need additional API call
      earnings: 0, // Would need additional calculation
      espnRank: team.playoffSeed,
      playoffSeed: team.playoffSeed,
      espnComponent: team.laLigaBucks?.espnComponent || 0,
      cumulativeComponent: team.laLigaBucks?.cumulativeComponent || 0,
      weeklyAvgComponent: 0 // Not implemented yet
    }));
  }

  // Helper to get owner name from ESPN owner ID
  getOwnerName(ownerId) {
    const ownerMap = {
      '{0653C009-02A9-41F7-81A4-94DE49FBDAFE}': 'Kris',
      '{BF4DA5CD-52FC-4A69-896F-BC7A17249860}': 'Mike',
      '{007F5398-0BBC-46FD-BF53-980BBC16FD55}': 'Vonnie',
      '{B5825ED4-BB63-4B1F-825E-D4BB635B1F72}': 'Edgar',
      '{4B1DDA8A-1318-4949-A91F-D9B76C3FC5D9}': 'George',
      '{B07A03AF-B9F6-471D-B11C-003E4A78286F}': 'Keith',
      '{29F7B9A0-2C6B-464F-AC4D-65EA5A60686B}': 'Justin',
      '{2D14BD0D-65CA-4F09-95A3-3A14A5242FBF}': 'Will',
      '{511F23C4-B237-49F9-B8DA-7BA13B1912E1}': 'Sean',
      '{F61C9304-FD75-44C7-9C93-04FD7594C762}': 'Kevin',
      '{093D75FC-3968-4ECE-8252-71FF095477E9}': 'Edgar',
      '{5CB933C7-9C74-43B4-B346-32C437231AF8}': 'Paul'
    };
    return ownerMap[ownerId] || 'Unknown';
  }

  // Helper to format win-loss record
  formatRecord(record) {
    if (!record) return '0-0';
    return `${record.wins}-${record.losses}`;
  }
}

// Global API instance
window.laLigaAPI = new LaLigaAPI();

/********************
 * Data Loading Functions *
 ********************/

// Load live team data from API
async function loadLiveTeamData(week = 14, season = 2025) {
  try {
    console.log(`Loading live team data for week ${week}, season ${season}...`);
    const rawTeams = await window.laLigaAPI.getTeamsLive(week, season);
    const transformedTeams = window.laLigaAPI.transformTeamData(rawTeams);
    
    // Sort by La Liga Bucks total
    transformedTeams.sort((a, b) => b.laLigaBucks - a.laLigaBucks);
    
    console.log(`Loaded ${transformedTeams.length} teams from API`);
    return transformedTeams;
  } catch (error) {
    console.error('Failed to load live team data:', error);
    
    // Fallback to static data
    console.warn('Falling back to static data');
    return appData.teams;
  }
}

// Load matchup data from API
async function loadMatchupData(week = 14, season = 2025) {
  try {
    console.log(`Loading matchup data for week ${week}, season ${season}...`);
    const matchups = await window.laLigaAPI.getMatchups(week, season);
    console.log(`Loaded ${matchups.length} matchups from API`);
    return matchups;
  } catch (error) {
    console.error('Failed to load matchup data:', error);
    return appData.matchups || [];
  }
}

// Initialize API connection and test
async function initializeAPI() {
  try {
    const health = await window.laLigaAPI.healthCheck();
    console.log('API connection established:', health.message);
    return true;
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
}