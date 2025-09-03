/**
 * La Liga del Fuego API - Main Entry Point
 * Modular serverless function handler for Vercel deployment
 * 
 * This replaces the monolithic api/index.js with a clean, organized structure
 * using controllers and centralized routing.
 */

const APIRouter = require('./routes');

/**
 * Main serverless function handler
 * @param {Object} req - Incoming HTTP request
 * @param {Object} res - HTTP response object
 */
module.exports = async function handler(req, res) {
  try {
    // Set CORS headers for all requests
    APIRouter.setCORSHeaders(res);

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Parse JSON body for POST/PUT/PATCH requests
    await APIRouter.parseJSONBody(req);

    // Route the request to appropriate controller
    await APIRouter.route(req, res);

  } catch (error) {
    console.error('❌ API Handler Error:', error);
    
    // Handle JSON parsing errors specifically
    if (error.message.includes('Invalid JSON')) {
      return res.status(400).json({ 
        error: 'Invalid JSON in request body',
        details: error.message 
      });
    }
    
    // Generic error handler
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};