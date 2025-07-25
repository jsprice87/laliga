const { fetchESPNTeams } = require('./espn/fetchTeams');
const { fetchESPNMatchups } = require('./espn/fetchMatchups');
const { calculateLaLigaBucks } = require('./laliga/calculateBucks');
const { updateWeeklyData, updateCurrentWeek } = require('./laliga/updateWeekly');
const { getTeams, getMatchups } = require('./database/schemas');
const { connectToMongoDB } = require('./database/connect');
const { registerUser, loginUser, getUserById, updateUserProfile, changePassword, authenticateToken, requireAdmin } = require('./auth/auth');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Health check
    if (pathname === '/api/health') {
      return res.status(200).json({ 
        status: 'OK', 
        message: 'La Liga del Fuego API is running',
        timestamp: new Date().toISOString()
      });
    }

    // Teams endpoint
    if (pathname === '/api/teams') {
      const { week = 14, season = 2024, live } = Object.fromEntries(url.searchParams);
      
      if (live === 'true') {
        const teams = await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season, week);
        const teamsWithBucks = calculateLaLigaBucks(teams);
        return res.status(200).json(teamsWithBucks);
      } else {
        const teams = await getTeams(season);
        return res.status(200).json(teams);
      }
    }

    // Matchups endpoint
    if (pathname === '/api/matchups') {
      const { week = 14, season = 2024 } = Object.fromEntries(url.searchParams);
      
      let matchups = await getMatchups(week, season);
      
      if (!matchups || matchups.length === 0) {
        try {
          const espnMatchups = await fetchESPNMatchups(process.env.ESPN_LEAGUE_ID, season, week);
          matchups = espnMatchups;
        } catch (espnError) {
          console.warn('ESPN matchups unavailable:', espnError.message);
          matchups = [];
        }
      }
      
      return res.status(200).json(matchups);
    }

    // Update endpoint
    if (pathname === '/api/update' && ['POST', 'PUT'].includes(req.method)) {
      const { week, current, season = 2024 } = Object.fromEntries(url.searchParams);
      
      if (current === 'true') {
        const result = await updateCurrentWeek();
        return res.status(200).json(result);
      } else if (week) {
        const weekNum = parseInt(week);
        
        if (weekNum < 1 || weekNum > 18) {
          return res.status(400).json({ error: 'Week must be between 1 and 18' });
        }
        
        const result = await updateWeeklyData(weekNum, season);
        return res.status(200).json(result);
      } else {
        return res.status(400).json({ error: 'Must specify week parameter or current=true' });
      }
    }

    // Database test endpoint
    if (pathname === '/api/test-db') {
      const db = await connectToMongoDB();
      const result = await db.admin().ping();
      
      return res.status(200).json({ 
        message: 'MongoDB connection successful', 
        result,
        timestamp: new Date().toISOString()
      });
    }

    // Authentication endpoints
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const { username, email, password, teamName } = req.body || {};
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }

      try {
        const result = await registerUser({ username, email, password, teamName });
        return res.status(201).json(result);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = req.body || {};
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      try {
        const result = await loginUser(email, password);
        return res.status(200).json(result);
      } catch (error) {
        return res.status(401).json({ error: error.message });
      }
    }

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      // This would need token parsing - simplified for now
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      try {
        const { verifyToken } = require('./auth/auth');
        const decoded = verifyToken(token);
        const user = await getUserById(decoded.userId);
        return res.status(200).json(user);
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (pathname === '/api/auth/profile' && req.method === 'PUT') {
      // Update user profile - would need authentication middleware
      return res.status(200).json({ message: 'Profile update endpoint - authentication required' });
    }

    // Not found
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};