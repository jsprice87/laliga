const { fetchESPNTeams } = require('./espn/fetchTeams');
const { fetchESPNMatchups } = require('./espn/fetchMatchups');
const { fetchESPNLeague } = require('./espn/fetchLeague');
const { calculateLaLigaBucks } = require('./laliga/calculateBucks');
const { calculateLigaBucksForSeason, getWeeklyMatchups } = require('./laliga/calculateLigaBucks');
const { updateWeeklyData, updateCurrentWeek } = require('./laliga/updateWeekly');
const { getTeams, getMatchups, saveTeams, saveMatchups, saveLeague } = require('./database/schemas');
const { connectToMongoDB } = require('./database/connect');
const { registerUser, loginUser, getUserById, generateResetToken, resetPassword, validateResetToken } = require('./auth/temp-auth');
const { transformESPNMatchups } = require('./utils/transformMatchups');
const { ensureCurrentSeasonData } = require('./utils/autoIngest');
const { ingestCleanSeason } = require('./utils/cleanIngestion');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse JSON body for POST/PUT requests (only if not already parsed by Express)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.body && req.headers['content-type']?.includes('application/json')) {
    try {
      let body = '';
      await new Promise((resolve, reject) => {
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', resolve);
        req.on('error', reject);
      });
      
      req.body = body ? JSON.parse(body) : {};
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
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

    // Teams endpoint - now with improved Liga Bucks calculation
    if (pathname === '/api/teams') {
      const { week = 14, season = 2025, live } = Object.fromEntries(url.searchParams);
      
      if (live === 'true') {
        // Special handling for 2025 season
        if (parseInt(season) >= 2025) {
          return res.status(200).json({
            season: parseInt(season),
            status: 'countdown',
            message: '🔥 COUNTDOWN TO 2025 SEASON 🔥',
            details: 'First game: Eagles vs Cowboys, September 4th, 8:20 PM ET',
            teams: [],
            leagueInfo: {
              name: 'La Liga del Fuego',
              draftStatus: 'Upcoming',
              seasonStart: '2025-09-04T20:20:00-04:00'
            }
          });
        }
        
        try {
          // Use new comprehensive Liga Bucks calculation
          const ligaBucksData = await calculateLigaBucksForSeason(process.env.ESPN_LEAGUE_ID, parseInt(season));
          return res.status(200).json(ligaBucksData);
        } catch (error) {
          console.warn('Liga Bucks calculation failed, falling back to basic method:', error.message);
          // Fallback to original method
          const teams = await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season, week);
          const teamsWithBucks = calculateLaLigaBucks(teams);
          return res.status(200).json(teamsWithBucks);
        }
      } else {
        // Ensure current season data is available before serving from MongoDB
        await ensureCurrentSeasonData(parseInt(season));
        
        const teams = await getTeams(season);
        return res.status(200).json(teams);
      }
    }

    // Matchups endpoint - enhanced for weekly data
    if (pathname === '/api/matchups') {
      const { week = 14, season = 2025 } = Object.fromEntries(url.searchParams);
      
      // Special handling for 2025 season
      if (parseInt(season) >= 2025) {
        return res.status(200).json({
          season: parseInt(season),
          week: parseInt(week),
          status: 'countdown',
          message: '🔥 COUNTDOWN TO 2025 SEASON 🔥',
          details: 'Matchups will be available when the season begins',
          matchups: []
        });
      }
      
      // Ensure current season data is available before serving from MongoDB
      await ensureCurrentSeasonData(parseInt(season));
      
      // Try new weekly matchups function first
      try {
        const weeklyMatchups = await getWeeklyMatchups(process.env.ESPN_LEAGUE_ID, parseInt(season), parseInt(week));
        if (weeklyMatchups && weeklyMatchups.length > 0) {
          return res.status(200).json(weeklyMatchups);
        }
      } catch (error) {
        console.warn('New weekly matchups failed, trying fallback methods:', error.message);
      }
      
      // Fallback to MongoDB data
      let matchups = await getMatchups(week, season);
      
      if (!matchups || matchups.length === 0) {
        try {
          // Last resort: fetch and transform ESPN data directly
          const espnMatchups = await fetchESPNMatchups(process.env.ESPN_LEAGUE_ID, season, week);
          const transformedMatchups = await transformESPNMatchups(espnMatchups, parseInt(week), parseInt(season));
          matchups = transformedMatchups;
        } catch (espnError) {
          console.warn('ESPN matchups unavailable:', espnError.message);
          matchups = [];
        }
      }
      
      return res.status(200).json(matchups);
    }

    // Update endpoint
    if (pathname === '/api/update' && ['POST', 'PUT'].includes(req.method)) {
      const { week, current, season = 2025 } = Object.fromEntries(url.searchParams);
      
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

    // Clean season data ingestion endpoint
    if (pathname.startsWith('/api/clean-ingest/') && req.method === 'POST') {
      const season = parseInt(pathname.split('/')[3]);
      
      if (!season || season < 2020 || season > 2025) {
        return res.status(400).json({ error: 'Invalid season year (2020-2025)' });
      }
      
      try {
        console.log(`🧹 Starting clean ingestion for season ${season}`);
        const result = await ingestCleanSeason(season);
        
        return res.status(200).json({
          message: `Season ${season} clean ingestion completed`,
          season: season,
          ...result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Clean ingestion failed for season ${season}:`, error.message);
        return res.status(500).json({
          error: `Clean ingestion failed for season ${season}`,
          details: error.message
        });
      }
    }

    // Season data ingestion endpoint
    if (pathname.startsWith('/api/ingest-season/') && req.method === 'POST') {
      const season = parseInt(pathname.split('/')[3]);
      
      if (!season || season < 2020 || season > 2025) {
        return res.status(400).json({ error: 'Invalid season year' });
      }
      
      console.log(`🔍 DEBUG: Ingesting complete season data for ${season}`);
      
      try {
        // Fetch and store league data
        const espnLeague = await fetchESPNLeague(process.env.ESPN_LEAGUE_ID, season);
        if (espnLeague) {
          await saveLeague(espnLeague, season);
          console.log(`✅ Stored league data for ${espnLeague.name} (${season})`);
        }
        
        // Fetch complete season data from ESPN API
        const espnTeams = await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season);
        console.log(`🔍 DEBUG: Fetched ${espnTeams?.length || 0} teams from ESPN for ${season}`);
        
        if (espnTeams && espnTeams.length > 0) {
          // Store teams in MongoDB
          await saveTeams(espnTeams, season);
          console.log(`✅ Stored ${espnTeams.length} teams in MongoDB for ${season}`);
        }
        
        // Fetch and store matchups for all weeks
        const allMatchups = [];
        for (let week = 1; week <= 17; week++) {
          try {
            const espnWeekMatchups = await fetchESPNMatchups(process.env.ESPN_LEAGUE_ID, season, week);
            if (espnWeekMatchups && espnWeekMatchups.length > 0) {
              // Transform ESPN format to our Matchup model format
              const transformedMatchups = await transformESPNMatchups(espnWeekMatchups, week, season);
              await saveMatchups(transformedMatchups, week, season);
              allMatchups.push(...transformedMatchups);
              console.log(`✅ Stored ${transformedMatchups.length} matchups for ${season} Week ${week}`);
            }
          } catch (weekError) {
            console.warn(`⚠️ Failed to fetch week ${week} for ${season}:`, weekError.message);
          }
        }
        
        return res.status(200).json({ 
          message: `Season ${season} data ingested successfully`,
          league: espnLeague?.name || 'Unknown',
          teams: espnTeams?.length || 0,
          matchups: allMatchups.length,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`❌ Failed to ingest season ${season}:`, error);
        return res.status(500).json({ 
          error: `Failed to ingest season ${season}: ${error.message}` 
        });
      }
    }

    // Database test endpoint
    if (pathname === '/api/test-db') {
      try {
        console.log('🔍 Testing MongoDB connection...');
        console.log('URI format:', process.env.MONGODB_URI?.substring(0, 50) + '...');
        
        const db = await connectToMongoDB();
        const result = await db.admin().ping();
        
        console.log('✅ MongoDB connection successful!');
        return res.status(200).json({ 
          message: 'MongoDB connection successful', 
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('Full error:', error);
        
        return res.status(500).json({
          error: 'MongoDB connection failed',
          details: error.message,
          mongoUriStart: process.env.MONGODB_URI?.substring(0, 50) + '...',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Debug endpoint to check environment variables
    if (pathname === '/api/debug-env') {
      return res.status(200).json({
        mongoUriExists: !!process.env.MONGODB_URI,
        mongoUriLength: process.env.MONGODB_URI?.length || 0,
        mongoUriStart: process.env.MONGODB_URI?.substring(0, 50) + '...',
        espnLeagueId: process.env.ESPN_LEAGUE_ID,
        timestamp: new Date().toISOString()
      });
    }

    // Clear corrupted data endpoint
    if (pathname === '/api/clear-data' && req.method === 'POST') {
      const { season } = Object.fromEntries(url.searchParams);
      
      try {
        const db = await connectToMongoDB();
        
        let result = {};
        
        if (season) {
          // Clear specific season
          const seasonNum = parseInt(season);
          result.teams = await db.collection('teams').deleteMany({ season: seasonNum });
          result.matchups = await db.collection('matchups').deleteMany({ season: seasonNum });
          result.league = await db.collection('league').deleteMany({ season: seasonNum });
          console.log(`🧹 Cleared season ${season}: ${result.teams.deletedCount} teams, ${result.matchups.deletedCount} matchups, ${result.league.deletedCount} league`);
        } else {
          // Clear all data
          result.teams = await db.collection('teams').deleteMany({});
          result.matchups = await db.collection('matchups').deleteMany({});
          result.league = await db.collection('league').deleteMany({});
          console.log(`🧹 Cleared all data: ${result.teams.deletedCount} teams, ${result.matchups.deletedCount} matchups, ${result.league.deletedCount} league`);
        }
        
        return res.status(200).json({
          message: season ? `Season ${season} data cleared` : 'All data cleared',
          deleted: {
            teams: result.teams.deletedCount,
            matchups: result.matchups.deletedCount,
            league: result.league.deletedCount
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Failed to clear data:`, error.message);
        return res.status(500).json({
          error: 'Failed to clear data',
          details: error.message
        });
      }
    }

    // Debug endpoint to check what's actually stored in MongoDB
    if (pathname === '/api/debug-data') {
      const { season = 2025 } = Object.fromEntries(url.searchParams);
      
      try {
        const db = await connectToMongoDB();
        
        const teamsCount = await db.collection('teams').countDocuments({ season: parseInt(season) });
        const matchupsCount = await db.collection('matchups').countDocuments({ season: parseInt(season) });
        const leagueCount = await db.collection('league').countDocuments({ season: parseInt(season) });
        
        const sampleTeam = await db.collection('teams').findOne({ season: parseInt(season) });
        const sampleMatchup = await db.collection('matchups').findOne({ season: parseInt(season) });
        const league = await db.collection('league').findOne({ season: parseInt(season) });
        
        // Debug teams query issue
        const allTeams = await db.collection('teams').find({ season: parseInt(season) }).limit(3).toArray();
        
        return res.status(200).json({
          season: parseInt(season),
          counts: {
            teams: teamsCount,
            matchups: matchupsCount,
            league: leagueCount
          },
          samples: {
            team: sampleTeam ? { name: sampleTeam.name, espnId: sampleTeam.espnId, laLigaBucks: sampleTeam.laLigaBucks } : null,
            matchup: sampleMatchup ? { week: sampleMatchup.week, team1: sampleMatchup.team1?.name, team2: sampleMatchup.team2?.name } : null,
            league: league ? { name: league.name, currentWeek: league.currentWeek } : null
          },
          allTeamsPreview: allTeams.map(t => ({ name: t.name, espnId: t.espnId, season: t.season, laLigaBucks: t.laLigaBucks })),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          error: 'Failed to check database',
          details: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Authentication endpoints
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      console.log('🔍 Register request received:', { body: req.body, headers: req.headers['content-type'] });
      
      const { username, email, password, teamName } = req.body || {};
      
      if (!username || !email || !password) {
        console.log('❌ Missing required fields:', { username: !!username, email: !!email, password: !!password });
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }

      try {
        console.log('🔄 Attempting to register user:', { username, email, teamName });
        const result = await registerUser({ username, email, password, teamName });
        console.log('✅ User registered successfully:', result.user.username);
        return res.status(201).json(result);
      } catch (error) {
        console.error('❌ Registration error:', error.message);
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
        const { verifyToken } = require('./auth/temp-auth');
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

    // Password reset endpoints
    if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      try {
        const result = await generateResetToken(email);
        
        console.log('🔑 Password reset requested for:', email);
        console.log('📧 Email result:', result.emailResult);
        
        // Prepare response based on email success
        let response = {
          message: 'Password reset instructions sent to your email'
        };

        // In development mode, include additional info
        if (process.env.NODE_ENV !== 'production') {
          if (result.emailResult.success) {
            response.emailSent = true;
            
            // Include preview URL for development mode (Ethereal Email)
            if (result.emailResult.previewUrl) {
              response.previewUrl = result.emailResult.previewUrl;
              response.devMessage = 'Email sent! View it at the preview URL';
            }
          } else {
            // Email failed, provide token as fallback for development
            response.emailSent = false;
            response.resetToken = result.resetToken;
            response.resetUrl = `http://localhost:8000/reset-password.html?token=${result.resetToken}`;
            response.devMessage = 'Email failed to send, using token fallback for development';
          }
        }
        
        return res.status(200).json(response);
      } catch (error) {
        console.error('❌ Password reset request error:', error.message);
        return res.status(400).json({ error: error.message });
      }
    }

    if (pathname === '/api/auth/validate-reset-token' && req.method === 'POST') {
      const { token } = req.body || {};
      
      if (!token) {
        return res.status(400).json({ error: 'Reset token is required' });
      }

      try {
        const validation = validateResetToken(token);
        return res.status(200).json(validation);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
      const { token, newPassword } = req.body || {};
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Reset token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      try {
        const result = await resetPassword(token, newPassword);
        return res.status(200).json(result);
      } catch (error) {
        console.error('❌ Password reset error:', error.message);
        return res.status(400).json({ error: error.message });
      }
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