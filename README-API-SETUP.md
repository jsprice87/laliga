# La Liga del Fuego API Setup Guide

## Quick Start for Testing Authentication

The authentication error you're seeing (`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`) occurs because the API server isn't running, so the browser is getting a 404 HTML page instead of JSON from the API endpoints.

## 🚀 Start the API Server

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create a `.env` file in the root directory:
```env
# MongoDB Connection (required for authentication)
MONGODB_URI=mongodb://localhost:27017/laliga
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/laliga

# JWT Secret for authentication tokens
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ESPN API credentials (optional for basic testing)
ESPN_LEAGUE_ID=789298
ESPN_S2=your_espn_s2_cookie
ESPN_SWID=your_espn_swid_cookie
```

### 3. Start the Development Server
```bash
# Option A: Start API server only
node api/server.js

# Option B: Start both frontend and API (recommended)
npm run dev
```

### 4. Verify API is Running
Open: http://localhost:3001/api/health

You should see: `{"status":"OK","message":"La Liga del Fuego API is running"}`

## 🧪 Test Authentication

### Option 1: Use the Test Page
Open: http://localhost:8000/test-auth.html

This will test all authentication endpoints and show detailed error messages.

### Option 2: Manual Testing
1. Open the main dashboard: http://localhost:8000
2. Try to create an account - it should now work!

## 🔧 Troubleshooting

### "Connection refused" or "Network error"
- Make sure the API server is running on port 3001
- Check that you have all dependencies installed: `npm install`

### "Database connection failed"
- Install MongoDB locally OR
- Set up MongoDB Atlas (free tier) and update `MONGODB_URI` in `.env`

### "JWT token errors"
- Make sure `JWT_SECRET` is set in your `.env` file

### "ESPN API errors" (for live data)
- ESPN credentials are optional for authentication testing
- Get your ESPN cookies from browser dev tools when logged into ESPN Fantasy

## 📁 File Structure
```
/api
├── server.js          # Local development server
├── index.js           # Main serverless function
├── auth/
│   └── auth.js        # Authentication logic
├── database/
│   ├── connect.js     # MongoDB connection
│   └── models/        # Data models
└── espn/             # ESPN API integration
```

## 🏃‍♂️ Quick Commands
```bash
# Start everything
npm run dev

# API server only
node api/server.js

# Frontend only  
cd laliga-final-trophy-dashboard && python3 -m http.server 8000

# Test specific API endpoint
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## 🎯 Next Steps
1. Set up MongoDB (local or Atlas)
2. Configure environment variables
3. Start the API server
4. Test authentication in the dashboard
5. Add ESPN credentials for live data (optional)

The dashboard is fully functional once the API server is running!