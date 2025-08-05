const { fetchESPNTeams } = require('./espn/fetchTeams');
const { fetchESPNMatchups } = require('./espn/fetchMatchups');
const { calculateLaLigaBucks } = require('./laliga/calculateBucks');
const { updateWeeklyData, updateCurrentWeek } = require('./laliga/updateWeekly');
const { getTeams, getMatchups } = require('./database/schemas');
const { connectToMongoDB } = require('./database/connect');
const { registerUser, loginUser, getUserById, generateResetToken, resetPassword, validateResetToken } = require('./auth/temp-auth');

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