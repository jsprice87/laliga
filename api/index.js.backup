require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const { connectToMongoDB } = require('./database/connect');
const { fetchESPNTeams } = require('./espn/fetchTeams');
const { fetchESPNMatchups } = require('./espn/fetchMatchups');
const { calculateLaLigaBucks } = require('./laliga/calculateBucks');
const { updateWeeklyData, updateCurrentWeek } = require('./laliga/updateWeekly');
const { initializeDatabase, getTeams, getMatchups } = require('./database/schemas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'La Liga del Fuego API is running' });
});

// Get teams with La Liga Bucks calculations (live from ESPN)
app.get('/api/teams/live', async (req, res) => {
  try {
    const week = req.query.week || 14;
    const season = req.query.season || 2024;
    
    // Fetch teams from ESPN API
    const teams = await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season, week);
    
    // Calculate La Liga Bucks
    const teamsWithBucks = calculateLaLigaBucks(teams);
    
    res.json(teamsWithBucks);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch team data' });
  }
});

// Get teams from database (cached)
app.get('/api/teams', async (req, res) => {
  try {
    const season = req.query.season || 2024;
    const teams = await getTeams(season);
    res.json(teams);
  } catch (error) {
    console.error('Database teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams from database' });
  }
});

// Get matchups for a specific week
app.get('/api/matchups', async (req, res) => {
  try {
    const week = req.query.week || 14;
    const season = req.query.season || 2024;
    
    // Try database first
    let matchups = await getMatchups(week, season);
    
    // If no cached data, fetch from ESPN
    if (!matchups || matchups.length === 0) {
      try {
        const espnMatchups = await fetchESPNMatchups(process.env.ESPN_LEAGUE_ID, season, week);
        matchups = espnMatchups;
      } catch (espnError) {
        console.warn('ESPN matchups unavailable:', espnError.message);
        matchups = [];
      }
    }
    
    res.json(matchups);
  } catch (error) {
    console.error('Matchups API Error:', error);
    res.status(500).json({ error: 'Failed to fetch matchup data' });
  }
});

// Update weekly data (manual trigger)
app.post('/api/update/:week', async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    const season = req.query.season || 2024;
    
    if (week < 1 || week > 18) {
      return res.status(400).json({ error: 'Week must be between 1 and 18' });
    }
    
    const result = await updateWeeklyData(week, season);
    res.json(result);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update weekly data' });
  }
});

// Update current week data
app.post('/api/update/current', async (req, res) => {
  try {
    const result = await updateCurrentWeek();
    res.json(result);
  } catch (error) {
    console.error('Current week update error:', error);
    res.status(500).json({ error: 'Failed to update current week' });
  }
});

// Test MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const result = await db.admin().ping();
    res.json({ message: 'MongoDB connection successful', result });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.listen(PORT, () => {
  console.log(`La Liga del Fuego API server running on port ${PORT}`);
});