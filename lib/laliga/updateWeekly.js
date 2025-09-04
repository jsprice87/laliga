const { fetchESPNTeams } = require('../espn/fetchTeams');
const { fetchESPNMatchups } = require('../espn/fetchMatchups');
const { calculateLaLigaBucks } = require('./calculateBucks');
const { saveTeams, saveMatchups } = require('../database/schemas');

async function updateWeeklyData(week, season = 2024) {
  try {
    console.log(`Updating data for Week ${week}, Season ${season}`);
    
    // Fetch teams data from ESPN
    const teams = await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season, week);
    console.log(`Fetched ${teams.length} teams from ESPN`);
    
    // Calculate La Liga Bucks
    const teamsWithBucks = calculateLaLigaBucks(teams);
    console.log('Calculated La Liga Bucks for all teams');
    
    // Save teams to database
    const teamsSaved = await saveTeams(teamsWithBucks, season);
    console.log(`Saved teams: ${teamsSaved.upsertedCount} new, ${teamsSaved.modifiedCount} updated`);
    
    // Fetch and save matchups
    try {
      const matchups = await fetchESPNMatchups(process.env.ESPN_LEAGUE_ID, season, week);
      if (matchups && matchups.length > 0) {
        const matchupsSaved = await saveMatchups(matchups, week, season);
        console.log(`Saved matchups: ${matchupsSaved?.upsertedCount || 0} new, ${matchupsSaved?.modifiedCount || 0} updated`);
      }
    } catch (matchupError) {
      console.warn('Could not fetch matchups:', matchupError.message);
    }
    
    return {
      success: true,
      week,
      season,
      teamsUpdated: teamsSaved.modifiedCount + teamsSaved.upsertedCount,
      message: `Successfully updated Week ${week} data`
    };
    
  } catch (error) {
    console.error('Weekly update error:', error);
    return {
      success: false,
      week,
      season,
      error: error.message
    };
  }
}

// Update current week automatically
async function updateCurrentWeek() {
  const currentWeek = getCurrentNFLWeek();
  return await updateWeeklyData(currentWeek);
}

// Helper function to determine current NFL week
function getCurrentNFLWeek() {
  // Simple approximation - in production, this would use NFL schedule API
  const now = new Date();
  const seasonStart = new Date('2024-09-05'); // Week 1 start
  const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, weeksSinceStart + 1));
}

module.exports = {
  updateWeeklyData,
  updateCurrentWeek,
  getCurrentNFLWeek
};