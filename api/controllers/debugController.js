/**
 * Debug Controller - For debugging Liga Bucks issues
 */

const { getWeeklyStandings } = require('../database/newSchemas');

class DebugController {
  /**
   * Get exactly what the frontend should receive for Liga Bucks
   * GET /api/debug/frontend-liga-bucks?season=2024&week=14
   */
  static async frontendLigaBucks(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const { season = 2024, week = 14 } = Object.fromEntries(url.searchParams);
      
      console.log(`🔧 DEBUG: Testing Liga Bucks for ${season} week ${week}`);
      
      // Get the exact same data the frontend would get
      const response = await fetch(`http://localhost:3001/api/teams?season=${season}&week=${week}`);
      const data = await response.json();
      
      // Analyze the Liga Bucks values
      const analysis = {
        totalTeams: data.teams?.length || 0,
        ligaBucksAnalysis: data.teams?.map(team => ({
          name: team.name,
          owner: team.owner,
          laLigaBucks: team.laLigaBucks,
          espnComponent: team.espnComponent,
          cumulativeComponent: team.cumulativeComponent,
          ligaBucksType: typeof team.laLigaBucks,
          isZero: team.laLigaBucks === 0,
          isNull: team.laLigaBucks === null,
          isUndefined: team.laLigaBucks === undefined
        })) || [],
        dataSource: data.metadata?.dataSource,
        timestamp: new Date().toISOString()
      };
      
      const problemTeams = analysis.ligaBucksAnalysis.filter(t => t.isZero || t.isNull || t.isUndefined);
      
      return res.status(200).json({
        success: true,
        season: parseInt(season),
        week: parseInt(week),
        summary: {
          totalTeams: analysis.totalTeams,
          problemTeams: problemTeams.length,
          workingTeams: analysis.totalTeams - problemTeams.length
        },
        problems: problemTeams.length > 0 ? problemTeams : null,
        allTeams: analysis.ligaBucksAnalysis,
        dataSource: analysis.dataSource,
        rawApiResponse: data,
        timestamp: analysis.timestamp
      });
      
    } catch (error) {
      console.error('❌ Debug Liga Bucks failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Debug failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = DebugController;