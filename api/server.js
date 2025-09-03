// Local development server for testing API endpoints
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const handler = require('./index.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Convert serverless function to Express middleware
app.use('/api', async (req, res) => {
  try {
    // Simulate Vercel serverless function environment
    const mockReq = {
      ...req,
      url: req.originalUrl,
      headers: req.headers,
      method: req.method,
      body: req.body // Pass the already parsed body from Express
    };
    
    await handler(mockReq, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Health check for the Express server itself
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Local development server running' });
});

app.listen(PORT, () => {
  console.log(`🚀 La Liga del Fuego API development server running on port ${PORT}`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;