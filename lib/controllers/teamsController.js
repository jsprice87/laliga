/**
 * Teams Controller - Team data and Liga Bucks calculations
 * Handles team information, rankings, and Liga Bucks scoring system
 */

const { getTeamsData, getDataSourceStatus } = require('../utils/dataRouter');
const { calculateLaLigaBucks } = require('../laliga/calculateBucks');
const { calculateLigaBucksForSeason } = require('../laliga/calculateLigaBucks');
const { getWeeklyStandings } = require('../database/newSchemas');

class TeamsController {
  /**
   * Get teams data with Liga Bucks calculations
   * GET /api/teams?week=14&season=2025&live=true
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getTeams(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const { week = 14, season = 2025, live } = Object.fromEntries(url.searchParams);
      
      const parsedSeason = parseInt(season);
      const parsedWeek = parseInt(week);
      const useLive = live === 'true';
      
      console.log(`🎯 TeamsController: Getting teams for season ${parsedSeason}, week ${parsedWeek}, live: ${useLive}`);
      
      // 2025 season is now LIVE! 🏈
      console.log(`🏈 LIVE 2025 SEASON ACTIVE - Getting live data for week ${parsedWeek}`);
      
      // For historical seasons (2024 and earlier), use new weekly_standings
      if (parsedSeason <= 2024) {
        console.log(`📊 Using new weekly_standings for historical season ${parsedSeason}`);
        const teams = await getWeeklyStandings(parsedSeason, parsedWeek);
        
        if (!teams || teams.length === 0) {
          console.warn(`⚠️ No weekly standings found for season ${parsedSeason} week ${parsedWeek}`);
          return res.status(404).json({
            error: `No data found for ${parsedSeason} season week ${parsedWeek}`,
            season: parsedSeason,
            week: parsedWeek,
            timestamp: new Date().toISOString()
          });
        }
        
        // Transform and enhance historical data
        const transformedTeams = teams.map(team => {
          // Fix record structure - convert nested record.overall to flat record
          let record = { wins: 0, losses: 0, ties: 0 };
          if (team.record && team.record.overall) {
            record = {
              wins: team.record.overall.wins || 0,
              losses: team.record.overall.losses || 0,
              ties: team.record.overall.ties || 0
            };
          } else if (team.record && typeof team.record.wins === 'number') {
            record = team.record;
          }

          return {
            ...team,
            logo: TeamsController.getLogoByTeamId(team.id || team.espnId),
            record: record,
            // Ensure proper field mapping for Liga Bucks calculations
            id: team.id || team.espnId,
            totalPoints: team.totalPoints || team.totalPointsFor || 0,
            playoffSeed: team.playoffSeed || 12
          };
        });

        // Calculate Liga Bucks for historical data
        console.log(`🧮 TeamsController: Calculating Liga Bucks for ${transformedTeams.length} historical teams`);
        const teamsWithBucks = calculateLaLigaBucks(transformedTeams);
        
        console.log(`✅ TeamsController: Returning ${teamsWithBucks.length} teams from weekly_standings with Liga Bucks`);
        return res.status(200).json({
          teams: teamsWithBucks,
          metadata: {
            season: parsedSeason,
            week: parsedWeek,
            count: teamsWithBucks.length,
            dataSource: {
              source: 'weekly_standings',
              status: 'FINAL',
              lastUpdated: new Date().toISOString(),
              season: parsedSeason,
              week: parsedWeek,
              refreshable: false
            },
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // For current/future seasons, use DataRouter (original logic)
      const teams = await getTeamsData(parsedSeason, parsedWeek, useLive);
      
      if (!teams || teams.length === 0) {
        console.warn(`⚠️ TeamsController: No teams data found for season ${parsedSeason}`);
        return res.status(404).json({
          error: 'No teams data available',
          season: parsedSeason,
          week: parsedWeek,
          timestamp: new Date().toISOString()
        });
      }
      
      // Debug: Log raw ESPN team record data
      if (teams.length > 0) {
        console.log(`🔍 DEBUG: Raw ESPN team record data for ${teams[0].name || 'Team 1'}:`);
        console.log(`   Record structure:`, JSON.stringify(teams[0].record, null, 2));
        console.log(`   Full team keys:`, Object.keys(teams[0]));
      }
      
      // LIVE DATA RECORD PROCESSING: Transform ESPN record structure
      const processedTeams = teams.map(team => {
        // Fix record structure - convert nested record.overall to flat record
        let record = { wins: 0, losses: 0, ties: 0 };
        if (team.record && team.record.overall) {
          record = {
            wins: team.record.overall.wins || 0,
            losses: team.record.overall.losses || 0,
            ties: team.record.overall.ties || 0
          };
          console.log(`🏈 PROCESSED RECORD for ${team.name}: ${record.wins}-${record.losses}-${record.ties}`);
        } else if (team.record && typeof team.record.wins === 'number') {
          record = team.record;
        }

        return {
          ...team,
          record: record,
          // Ensure proper field mapping for Liga Bucks calculations
          id: team.id || team.espnId,
          totalPoints: team.totalPoints || team.totalPointsFor || team.points || 0,
          playoffSeed: team.playoffSeed || 12
        };
      });
      
      // Calculate Liga Bucks if not already present
      let teamsWithBucks = processedTeams;
      if (processedTeams.length > 0 && !processedTeams[0].laLigaBucks) {
        console.log(`🧮 TeamsController: Calculating Liga Bucks for ${processedTeams.length} teams`);
        teamsWithBucks = calculateLaLigaBucks(processedTeams.map(team => ({
          ...team,
          id: team.espnId || team.id,
          playoffSeed: team.playoffSeed || 12,
          totalPointsFor: team.totalPoints || team.totalPointsFor || 0
        })));
      }
      
      // Get data source status for response metadata
      const sourceStatus = getDataSourceStatus(parsedSeason, parsedWeek);
      
      console.log(`✅ TeamsController: Returning ${teamsWithBucks.length} teams from ${sourceStatus.source}`);
      
      return res.status(200).json({
        teams: teamsWithBucks,
        metadata: {
          season: parsedSeason,
          week: parsedWeek,
          count: teamsWithBucks.length,
          dataSource: sourceStatus,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ TeamsController error:', error.message);
      return res.status(500).json({ 
        error: 'Failed to fetch teams data',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate request parameters for teams endpoint
   * @param {Object} params - Request parameters
   * @returns {Object} Validation result
   */
  static validateTeamsParams(params) {
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

  /**
   * Get logo URL by team ID from current ESPN data mapping
   * @param {number} teamId - ESPN team ID
   * @returns {string} Logo URL or empty string
   */
  static getLogoByTeamId(teamId) {
    const logoMapping = {
      1: "https://media.tenor.com/images/d8ee62302306894badd64ab380176ac6/tenor.gif",
      2: "http://blogs.denverpost.com/broncos/files/2015/08/von-miller-broncos-training-camp.jpg", 
      3: "https://i.postimg.cc/kMkMJDfQ/TECOMDt.jpg",
      4: "https://ih0.redbubble.net/image.242052334.1669/poster,840x830,f8f8f8-pad,750x1000,f8f8f8.u1.jpg",
      5: "https://i.pinimg.com/236x/cc/6f/97/cc6f97cc03ea7350b67cd7064b4470b2--phoenix-oil.jpg",
      8: "https://pbs.twimg.com/profile_images/1675634586833829891/S68kfoNc_400x400.jpg",
      10: "https://s3.amazonaws.com/fbasfb/img/uploads/52525f22-2a00-4fe3-9528-4a26cdc4d1be",
      11: "https://media1.tenor.com/m/l8RwbTkpNXsAAAAd/mike-tomlin-walk-away.gif",
      12: "https://g.espncdn.com/s/ffllm/logos/CrazyHelmets-ToddDetwiler/Helmets_06.svg",
      13: "http://m.quickmeme.com/img/53/539455095e2a7f4079fd49e76df30293b5da1b74b2b43cbe1ff5782e9aae5c0f.jpg",
      14: "https://g.espncdn.com/lm-static/logo-packs/ffl/TeamKinny-MartinLaksman/TeamKinny-24.svg",
      15: "https://i.pinimg.com/736x/43/ad/b0/43adb04d8766ae8147de4620a8fe0919.jpg"
    };
    
    return logoMapping[teamId] || "";
  }
}

module.exports = TeamsController;