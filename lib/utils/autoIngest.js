// Automatic data ingestion utilities
const { getTeams, getMatchups, getLeague } = require('../database/schemas');

// Check if season data exists in MongoDB
async function hasSeasonData(season = 2024) {
  try {
    const teams = await getTeams(season);
    const sampleMatchups = await getMatchups(1, season); // Check week 1 matchups
    const league = await getLeague(season);
    
    const hasTeams = teams && teams.length > 0;
    const hasMatchups = sampleMatchups && sampleMatchups.length > 0;
    const hasLeague = league && league.season === season;
    
    console.log(`🔍 Season ${season} data check: Teams=${hasTeams ? teams.length : 0}, Matchups=${hasMatchups ? sampleMatchups.length : 0}, League=${hasLeague ? 'Yes' : 'No'}`);
    
    return hasTeams && hasMatchups && hasLeague;
  } catch (error) {
    console.warn(`⚠️ Error checking season ${season} data:`, error.message);
    return false;
  }
}

// Trigger season data ingestion via internal API call
async function triggerSeasonIngestion(season = 2024) {
  try {
    console.log(`🔄 Triggering automatic ingestion for season ${season}...`);
    
    // Import required modules locally to avoid circular dependencies
    const { fetchESPNTeams } = require('../espn/fetchTeams');
    const { fetchESPNMatchups } = require('../espn/fetchMatchups');
    const { fetchESPNLeague } = require('../espn/fetchLeague');
    const { saveTeams, saveMatchups, saveLeague } = require('../database/schemas');
    const { transformESPNMatchups } = require('./transformMatchups');
    
    // Fetch and save league data
    const espnLeague = await fetchESPNLeague(process.env.ESPN_LEAGUE_ID, season);
    if (espnLeague) {
      await saveLeague(espnLeague, season);
      console.log(`✅ Auto-ingested league data for ${espnLeague.name} (${season})`);
    }
    
    // Fetch and save teams
    const espnTeams = await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season);
    if (espnTeams && espnTeams.length > 0) {
      await saveTeams(espnTeams, season);
      console.log(`✅ Auto-ingested ${espnTeams.length} teams for ${season}`);
    }
    
    // Fetch and save matchups for current and past weeks
    let totalMatchups = 0;
    for (let week = 1; week <= 17; week++) {
      try {
        const espnWeekMatchups = await fetchESPNMatchups(process.env.ESPN_LEAGUE_ID, season, week);
        if (espnWeekMatchups && espnWeekMatchups.length > 0) {
          const transformedMatchups = await transformESPNMatchups(espnWeekMatchups, week, season);
          await saveMatchups(transformedMatchups, week, season);
          totalMatchups += transformedMatchups.length;
          console.log(`✅ Auto-ingested ${transformedMatchups.length} matchups for ${season} Week ${week}`);
        }
      } catch (weekError) {
        console.warn(`⚠️ Auto-ingest failed for ${season} Week ${week}:`, weekError.message);
      }
    }
    
    console.log(`🎉 Auto-ingestion complete for ${season}: League=${espnLeague?.name || 'Unknown'}, ${espnTeams?.length || 0} teams, ${totalMatchups} matchups`);
    return true;
  } catch (error) {
    console.error(`❌ Auto-ingestion failed for season ${season}:`, error.message);
    return false;
  }
}

// Ensure current season data is available
async function ensureCurrentSeasonData(season = 2024) {
  const hasData = await hasSeasonData(season);
  
  if (!hasData) {
    console.log(`🔄 Season ${season} data missing, triggering auto-ingestion...`);
    
    // For 2025 and future seasons, check if ESPN has meaningful data
    if (season >= 2025) {
      console.log(`⚠️ Season ${season} is future season - skipping auto-ingestion to prevent corruption`);
      return false;
    }
    
    return await triggerSeasonIngestion(season);
  }
  
  console.log(`✅ Season ${season} data already available`);
  return true;
}

module.exports = {
  hasSeasonData,
  triggerSeasonIngestion,
  ensureCurrentSeasonData
};