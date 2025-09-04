const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import the main API handler
const apiHandler = require('./index');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes - handle all /api requests
app.all('/api/*', async (req, res) => {
  try {
    // Adapt the serverless handler to work with Express
    await apiHandler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve frontend for all other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 La Liga del Fuego API development server running on port ${PORT}`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  
  // Email service info
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log('🧪 Email service configured for development mode');
    console.log('📧 Test email credentials: Check console output from emailService');
    console.log('🔗 View sent emails at: https://ethereal.email/messages');
  }
});