/**
 * API Router - Centralized route handling for La Liga del Fuego API
 * Maps endpoints to their respective controllers and handles middleware
 */

const HealthController = require('./controllers/healthController');
const TeamsController = require('./controllers/teamsController');
const MatchupsController = require('./controllers/matchupsController');
const AuthController = require('./controllers/authController');
const AdminController = require('./controllers/adminController');
const MigrationController = require('./controllers/migrationController');
const DebugController = require('./controllers/debugController');

class APIRouter {
  /**
   * Route incoming requests to appropriate controllers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async route(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    try {
      // Health and diagnostic endpoints
      if (pathname === '/api/health') {
        return await HealthController.health(req, res);
      }
      
      if (pathname === '/api/test-db') {
        return await HealthController.testDatabase(req, res);
      }
      
      if (pathname === '/api/debug-env') {
        return await HealthController.debugEnvironment(req, res);
      }
      
      if (pathname === '/api/debug-data') {
        return await HealthController.debugData(req, res);
      }

      // Teams endpoints
      if (pathname === '/api/teams' && method === 'GET') {
        return await TeamsController.getTeams(req, res);
      }
      
      if (pathname === '/api/teams/live' && method === 'GET') {
        // Add live=true parameter for live data
        const url = new URL(req.url, `http://${req.headers.host}`);
        url.searchParams.set('live', 'true');
        req.url = url.pathname + url.search;
        return await TeamsController.getTeams(req, res);
      }
      
      if (pathname === '/api/teams/historical' && method === 'GET') {
        // Historical data (without live parameter)
        return await TeamsController.getTeams(req, res);
      }

      // Matchups endpoints  
      if (pathname === '/api/matchups' && method === 'GET') {
        return await MatchupsController.getMatchups(req, res);
      }

      // Authentication endpoints
      if (pathname === '/api/auth/register' && method === 'POST') {
        return await AuthController.register(req, res);
      }
      
      if (pathname === '/api/auth/login' && method === 'POST') {
        return await AuthController.login(req, res);
      }
      
      if (pathname === '/api/auth/me' && method === 'GET') {
        return await AuthController.getCurrentUser(req, res);
      }
      
      if (pathname === '/api/auth/profile' && method === 'PUT') {
        return await AuthController.updateProfile(req, res);
      }
      
      if (pathname === '/api/auth/forgot-password' && method === 'POST') {
        return await AuthController.forgotPassword(req, res);
      }
      
      if (pathname === '/api/auth/validate-reset-token' && method === 'POST') {
        return await AuthController.validateResetToken(req, res);
      }
      
      if (pathname === '/api/auth/reset-password' && method === 'POST') {
        return await AuthController.resetPassword(req, res);
      }

      // Administrative endpoints (require proper authentication in production)
      if (pathname === '/api/update' && ['POST', 'PUT'].includes(method)) {
        return await AdminController.updateData(req, res);
      }
      
      if (pathname.startsWith('/api/clean-ingest/') && method === 'POST') {
        return await AdminController.cleanIngestSeason(req, res);
      }
      
      if (pathname.startsWith('/api/ingest-season/') && method === 'POST') {
        return await AdminController.ingestSeason(req, res);
      }
      
      if (pathname === '/api/clear-data' && method === 'POST') {
        return await AdminController.clearData(req, res);
      }

      // Migration endpoints
      if (pathname === '/api/migrate/run-full-migration' && method === 'POST') {
        return await MigrationController.runFullMigration(req, res);
      }
      
      if (pathname === '/api/migrate/test-weekly-standings' && method === 'GET') {
        return await MigrationController.testWeeklyStandings(req, res);
      }
      
      if (pathname === '/api/migrate/init-collections' && method === 'POST') {
        return await MigrationController.initCollections(req, res);
      }
      
      if (pathname === '/api/migrate/populate-teams-master' && method === 'POST') {
        return await MigrationController.populateTeamsMasterOnly(req, res);
      }

      // Debug endpoints
      if (pathname === '/api/debug/frontend-liga-bucks' && method === 'GET') {
        return await DebugController.frontendLigaBucks(req, res);
      }

      // Route not found
      return res.status(404).json({ 
        error: 'Endpoint not found',
        path: pathname,
        method: method,
        availableEndpoints: APIRouter.getAvailableEndpoints()
      });

    } catch (error) {
      console.error('❌ Router error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get list of available API endpoints for documentation
   * @returns {Array} Array of endpoint descriptions
   */
  static getAvailableEndpoints() {
    return [
      // Health endpoints
      { method: 'GET', path: '/api/health', description: 'Basic health check' },
      { method: 'GET', path: '/api/test-db', description: 'Test database connection' },
      { method: 'GET', path: '/api/debug-env', description: 'Debug environment variables' },
      { method: 'GET', path: '/api/debug-data', description: 'Debug database contents' },
      
      // Teams endpoints
      { method: 'GET', path: '/api/teams', description: 'Get teams with Liga Bucks calculations', params: 'week, season, live' },
      
      // Matchups endpoints
      { method: 'GET', path: '/api/matchups', description: 'Get weekly matchups', params: 'week, season' },
      
      // Authentication endpoints
      { method: 'POST', path: '/api/auth/register', description: 'Register new user account' },
      { method: 'POST', path: '/api/auth/login', description: 'User login' },
      { method: 'GET', path: '/api/auth/me', description: 'Get current user info', auth: 'required' },
      { method: 'PUT', path: '/api/auth/profile', description: 'Update user profile', auth: 'required' },
      { method: 'POST', path: '/api/auth/forgot-password', description: 'Request password reset' },
      { method: 'POST', path: '/api/auth/validate-reset-token', description: 'Validate reset token' },
      { method: 'POST', path: '/api/auth/reset-password', description: 'Reset password with token' },
      
      // Admin endpoints
      { method: 'POST', path: '/api/update', description: 'Update weekly or current data', params: 'week, current, season' },
      { method: 'POST', path: '/api/clean-ingest/:season', description: 'Clean season data ingestion' },
      { method: 'POST', path: '/api/ingest-season/:season', description: 'Full season data ingestion' },
      { method: 'POST', path: '/api/clear-data', description: 'Clear database data', params: 'season (optional)' }
    ];
  }

  /**
   * Middleware for parsing JSON request bodies
   * @param {Object} req - Express request object
   */
  static async parseJSONBody(req) {
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
        throw new Error('Invalid JSON in request body');
      }
    }
  }

  /**
   * CORS middleware
   * @param {Object} res - Express response object
   */
  static setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

module.exports = APIRouter;