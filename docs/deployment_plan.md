# La Liga del Fuego - Deployment Plan

## Executive Summary

This document outlines a comprehensive plan to get La Liga del Fuego running locally and deployed to production with minimal cost and complexity. Based on research, **Hostinger shared hosting does not support Node.js**, so we'll pivot to a **free static hosting approach** with serverless functions.

## Key Findings & Decisions

### Hostinger Limitation
- ❌ **Hostinger shared hosting does NOT support Node.js** (as of 2024)
- ❌ VPS required ($4.99/month minimum) - not ideal for hobby project
- ✅ **Recommended Alternative**: Static hosting with serverless functions

### Chosen Architecture
- **Frontend**: Static site (HTML/CSS/JS) - current dashboard works perfectly
- **Backend**: Serverless functions for ESPN API calls and data processing
- **Database**: MongoDB Atlas Free Tier (512MB, sufficient for league data)
- **Hosting**: Vercel (recommended) or Netlify (both have generous free tiers)

## 🚀 Quick Start Checklist

**Before you begin, you'll need to complete these human tasks:**

### Account Setup Tasks
- [ ] **MongoDB Atlas Account**: Create free account at [mongodb.com/atlas](https://mongodb.com/atlas)
- [ ] **Vercel Account**: Create account at [vercel.com](https://vercel.com) (connect with GitHub)
- [ ] **GitHub Account** (optional but recommended): For code repository

### Information You'll Need to Gather
- [ ] **ESPN Credentials**: Already extracted from `legacy-python/config.py`:
  - ESPN_S2: `AEBikqIeYZqQSB78s2Qd%2Bo3AXTKWNG6qZum9bkULpljLg9fiavdj6x8JjU0Tp6Nk%2BG1TbOhbUqG5X6fmkLmjuZzeeR7qUWuum9%2FePph1vnApGQhr68DK656W3B4cqIZ9GRhqxoZJskDDCXC%2Bpj2A7xZK%2B%2BiExDaxUfWD0tnzsdmujN7QLlAl3RqaAL9A0FrFZh4USFT2h3n%2BbwULZBJwiQSA4Yuemx2b%2BnR880IPNlrxQ26CmmxxqM9j5xGy2fX9cvtxrw8Rg19Hme1GlogYZynhjd6lLv765y0EFCHsXwj%2FhWKu3Yx2oy%2BPVSWGY44My6E%3D`
  - ESPN_SWID: `{29F7B9A0-2C6B-464F-AC4D-65EA5A60686B}`
  - ESPN_LEAGUE_ID: `789298`
- [ ] **MongoDB Connection String**: You'll get this after creating your Atlas cluster
- [ ] **Database Password**: Create a secure password for your MongoDB user

### Software Prerequisites
- [ ] **Node.js 18+**: Check with `node --version` (install from [nodejs.org](https://nodejs.org))
- [ ] **Git**: Check with `git --version`
- [ ] **Code Editor**: VS Code recommended ([code.visualstudio.com](https://code.visualstudio.com))

## Phase 1: Local Development Environment

### Prerequisites & Human Tasks
**🧑‍💻 HUMAN TASK**: Verify you have the following installed:
- Node.js 18+ (check with `node --version`) - Install from [nodejs.org](https://nodejs.org) if needed
- Git (for version control) - Check with `git --version`
- Code editor (VS Code recommended) - Download from [code.visualstudio.com](https://code.visualstudio.com)

### Step 1: Project Structure Setup
```
/Users/justin/projects/laliga/
├── laliga-final-trophy-dashboard/    # Current static frontend
├── api/                              # New: Serverless functions
├── data/                            # New: Data processing utilities
├── scripts/                         # New: Development scripts
├── .env.local                       # New: Environment variables
├── package.json                     # New: Project dependencies
└── vercel.json                      # New: Deployment configuration
```

### Step 2: Initialize Node.js Project
**🧑‍💻 HUMAN TASK**: Run these commands in Terminal:
```bash
cd /Users/justin/projects/laliga
npm init -y
npm install --save-dev nodemon concurrently
npm install axios dotenv node-cron mongodb@5.5
```

### Step 3: Environment Variables Setup
**🧑‍💻 HUMAN TASK**: Create a `.env.local` file in the root directory with these credentials (found in `legacy-python/config.py`):
```env
# ESPN API Credentials (from legacy-python/config.py)
ESPN_S2=AEBikqIeYZqQSB78s2Qd%2Bo3AXTKWNG6qZum9bkULpljLg9fiavdj6x8JjU0Tp6Nk%2BG1TbOhbUqG5X6fmkLmjuZzeeR7qUWuum9%2FePph1vnApGQhr68DK656W3B4cqIZ9GRhqxoZJskDDCXC%2Bpj2A7xZK%2B%2BiExDaxUfWD0tnzsdmujN7QLlAl3RqaAL9A0FrFZh4USFT2h3n%2BbwULZBJwiQSA4Yuemx2b%2BnR880IPNlrxQ26CmmxxqM9j5xGy2fX9cvtxrw8Rg19Hme1GlogYZynhjd6lLv765y0EFCHsXwj%2FhWKu3Yx2oy%2BPVSWGY44My6E%3D
ESPN_SWID={29F7B9A0-2C6B-464F-AC4D-65EA5A60686B}
ESPN_LEAGUE_ID=789298

# MongoDB Atlas (provided connection string)
MONGODB_URI=mongodb+srv://jsprice87:vzVgED4VN4WhqRpe@laliga-cluster.ifqe6ls.mongodb.net/?retryWrites=true&w=majority&appName=laliga-cluster

# Development
NODE_ENV=development
PORT=3000
```

**⚠️ IMPORTANT**: Add `.env.local` to your `.gitignore` file to keep credentials secure!

### Step 4: Local Development Server
**🧑‍💻 HUMAN TASK**: Add these scripts to your `package.json` file (edit the "scripts" section):
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:api\"",
    "dev:frontend": "cd laliga-final-trophy-dashboard && python3 -m http.server 3000",
    "dev:api": "nodemon api/index.js",
    "build": "npm run build:frontend",
    "build:frontend": "echo 'Static files ready for deployment'"
  }
}
```

**🧑‍💻 HUMAN TASK**: Create a `.gitignore` file in the root directory:
```gitignore
node_modules/
.env.local
.env
.vercel
.DS_Store
npm-debug.log*
```

## Phase 2: Backend API Development

### Step 1: Create Serverless API Structure
**🧑‍💻 HUMAN TASK**: Create these directories and files in your project:
```bash
mkdir -p api/espn api/laliga api/database/models
touch api/index.js
touch api/espn/fetchTeams.js api/espn/fetchMatchups.js api/espn/fetchStandings.js
touch api/laliga/calculateBucks.js api/laliga/updateWeekly.js
touch api/database/connect.js api/database/models/Team.js api/database/models/Matchup.js
```

**Directory structure should look like:**
```
api/
├── index.js                 # Main API router
├── espn/
│   ├── fetchTeams.js       # Get team data
│   ├── fetchMatchups.js    # Get weekly matchups
│   └── fetchStandings.js   # Get current standings
├── laliga/
│   ├── calculateBucks.js   # La Liga Bucks calculation
│   └── updateWeekly.js     # Weekly data processing
└── database/
    ├── connect.js          # MongoDB connection
    └── models/             # Data models
        ├── Team.js
        └── Matchup.js
```

### Step 2: ESPN API Integration
Convert existing Python logic to JavaScript:

**api/espn/fetchTeams.js**:
```javascript
const axios = require('axios');

async function fetchESPNTeams(leagueId, season, week) {
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
  
  try {
    const response = await axios.get(url, {
      params: {
        view: 'mTeam',
        scoringPeriodId: week
      },
      headers: {
        'Cookie': `espn_s2=${process.env.ESPN_S2}; SWID=${process.env.ESPN_SWID}`
      }
    });
    
    return response.data.teams;
  } catch (error) {
    console.error('ESPN API Error:', error);
    throw error;
  }
}

module.exports = { fetchESPNTeams };
```

### Step 3: La Liga Bucks Calculation Service
**api/laliga/calculateBucks.js**:
```javascript
function calculateLaLigaBucks(teams, weeklyData) {
  return teams.map(team => {
    // ESPN Rank Component (1-12 points)
    const espnComponent = 13 - team.playoffSeed;
    
    // Cumulative Points Component (1-12 points)
    const pointsRank = teams
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .findIndex(t => t.id === team.id) + 1;
    const cumulativeComponent = 13 - pointsRank;
    
    // Weekly Average Component (1-12 points)
    const avgRank = calculateWeeklyAverage(team.id, weeklyData);
    const weeklyAvgComponent = 13 - avgRank;
    
    return {
      ...team,
      espnComponent,
      cumulativeComponent,
      weeklyAvgComponent,
      totalLaLigaBucks: espnComponent + cumulativeComponent + weeklyAvgComponent
    };
  });
}

module.exports = { calculateLaLigaBucks };
```

### Step 4: Database Models
**api/database/models/Team.js**:
```javascript
const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  espnId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  season: { type: Number, required: true },
  weeklyData: [{
    week: Number,
    espnRank: Number,
    totalPoints: Number,
    weeklyPoints: Number,
    laLigaBucks: {
      espnComponent: Number,
      cumulativeComponent: Number,
      weeklyAvgComponent: Number,
      total: Number
    }
  }],
  seasonTotals: {
    wins: Number,
    losses: Number,
    pointsFor: Number,
    pointsAgainst: Number,
    totalLaLigaBucks: Number,
    playoffSeed: Number
  }
});

module.exports = mongoose.model('Team', TeamSchema);
```

## Phase 3: Database Setup

### Step 1: MongoDB Atlas Free Tier Setup
**🧑‍💻 HUMAN TASK**: Follow these steps to create your free MongoDB database:

**A. Create MongoDB Atlas Account**
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Verify your email address

**B. Create Free Cluster**
1. Choose "Build a Database" → "M0" (FREE)
2. **Cloud Provider**: AWS (recommended)
3. **Region**: Choose closest to your location (e.g., us-east-1 for East Coast)
4. **Cluster Name**: `laliga-cluster`
5. Click "Create Cluster"

**C. Database Access (Create User)**
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. **Authentication Method**: Password
4. **Username**: `laliga-admin`
5. **Password**: Generate secure password (save this!)
6. **Database User Privileges**: "Read and write to any database"
7. Click "Add User"
vzVgED4VN4WhqRpe

**D. Network Access (Allow Connections)**
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. **Access List Entry**: `0.0.0.0/0` (Allow access from anywhere)
4. **Comment**: "Allow all IPs for development"
5. Click "Confirm"

**E. Get Connection String**
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. **Driver**: Node.js
5. **Version**: 5.5 or later
6. Copy the connection string (looks like: `mongodb+srv://laliga-admin:<password>@laliga-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
7. Replace `<password>` with your actual database password
8. Add database name: `mongodb+srv://laliga-admin:yourpassword@laliga-cluster.xxxxx.mongodb.net/laliga?retryWrites=true&w=majority`

mongodb+srv://jsprice87:vzVgED4VN4WhqRpe@laliga-cluster.ifqe6ls.mongodb.net/?retryWrites=true&w=majority&appName=laliga-cluster

**F. Update .env.local File**
Replace the MONGODB_URI in your `.env.local` with your actual connection string

### Step 2: Database Schema Design
```javascript
// Collections Structure
{
  teams: [
    {
      espnId: 1,
      name: "Kris P. Roni",
      owner: "Kris",
      season: 2024,
      weeklyData: [...],
      seasonTotals: {...}
    }
  ],
  matchups: [
    {
      week: 14,
      season: 2024,
      team1: ObjectId,
      team2: ObjectId,
      team1Score: 156.2,
      team2Score: 143.8,
      winner: ObjectId
    }
  ],
  league: [
    {
      season: 2024,
      currentWeek: 14,
      teams: 12,
      champions: ["2024 Kris P. Roni", "2023 Other Winner"],
      sackos: ["2024 Last Place", "2023 Previous Loser"]
    }
  ]
}
```

### Step 3: Data Migration Strategy
**scripts/migrate-historical-data.js**:
```javascript
// Convert CSV data from legacy-python/results/ to MongoDB
// Import 2024 season data as baseline
// Set up weekly data structure for future updates
```

## Phase 4: Frontend Integration

### Step 1: Update Dashboard API Calls
Replace static data in `app.js` with API calls:

```javascript
// Replace static appData with API calls
async function loadTeamData(week = 14) {
  try {
    const response = await fetch(`/api/teams?week=${week}`);
    const teams = await response.json();
    return teams;
  } catch (error) {
    console.error('Failed to load team data:', error);
    // Fallback to static data if API fails
    return appData.teams;
  }
}

async function loadMatchupData(week = 14) {
  try {
    const response = await fetch(`/api/matchups?week=${week}`);
    const matchups = await response.json();
    return matchups;
  } catch (error) {
    console.error('Failed to load matchup data:', error);
    return appData.matchups;
  }
}
```

### Step 2: Progressive Enhancement
- Keep static data as fallback
- Enhance with live data when available
- Maintain offline functionality

### Step 3: Environment-Specific Configuration
```javascript
const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    pollInterval: 60000 // 1 minute for development
  },
  production: {
    apiUrl: '/api',
    pollInterval: 300000 // 5 minutes for production
  }
};
```

## Phase 5: Deployment Configuration

### Step 1: Vercel Setup (Recommended)
**vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "laliga-final-trophy-dashboard/**",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/laliga-final-trophy-dashboard/$1"
    }
  ],
  "env": {
    "ESPN_S2": "@espn_s2",
    "ESPN_SWID": "@espn_swid",
    "ESPN_LEAGUE_ID": "@espn_league_id",
    "MONGODB_URI": "@mongodb_uri"
  }
}
```

### Step 2: Alternative Environment Variable Setup
**🧑‍💻 HUMAN TASK**: If you prefer using the Vercel dashboard:
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `laliga-del-fuego` project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: `ESPN_S2`, **Value**: `AEBikqIeYZqQSB78s2Qd%2Bo3AXTKWNG6qZum9bkULpljLg9fiavdj6x8JjU0Tp6Nk%2BG1TbOhbUqG5X6fmkLmjuZzeeR7qUWuum9%2FePph1vnApGQhr68DK656W3B4cqIZ9GRhqxoZJskDDCXC%2Bpj2A7xZK%2B%2BiExDaxUfWD0tnzsdmujN7QLlAl3RqaAL9A0FrFZh4USFT2h3n%2BbwULZBJwiQSA4Yuemx2b%2BnR880IPNlrxQ26CmmxxqM9j5xGy2fX9cvtxrw8Rg19Hme1GlogYZynhjd6lLv765y0EFCHsXwj%2FhWKu3Yx2oy%2BPVSWGY44My6E%3D`
   - **Name**: `ESPN_SWID`, **Value**: `{29F7B9A0-2C6B-464F-AC4D-65EA5A60686B}`
   - **Name**: `ESPN_LEAGUE_ID`, **Value**: `789298`
   - **Name**: `MONGODB_URI`, **Value**: Your MongoDB connection string
5. Check "Production" environment for each

### Step 3: Deployment Script
**scripts/deploy.sh**:
```bash
#!/bin/bash
echo "Deploying La Liga del Fuego..."

# Build frontend
npm run build

# Deploy to Vercel
vercel --prod

echo "Deployment complete!"
echo "Check https://laliga-del-fuego.vercel.app"
```

## Phase 6: Production Deployment

### Step 1: Create Vercel Account
**🧑‍💻 HUMAN TASK**: Set up Vercel for hosting:

**A. Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Click "Start Deploying" → "Continue with GitHub"
3. Authorize Vercel to access your GitHub account

**B. Install Vercel CLI**
```bash
npm install -g vercel
```

**C. Login to Vercel**
```bash
vercel login
```
(This will open a browser to authenticate)

### Step 2: Git Repository Setup
**🧑‍💻 HUMAN TASK**: Set up your Git repository:
```bash
cd /Users/justin/projects/laliga
git init
git add .
git commit -m "Initial La Liga del Fuego deployment setup"
```

**Optional: Push to GitHub**
1. Create a new repository at [github.com/new](https://github.com/new)
2. Name it `laliga-del-fuego`
3. Follow GitHub's instructions to push your code

### Step 3: Configure Vercel Environment Variables
**🧑‍💻 HUMAN TASK**: Set environment variables for production:

**A. First Deployment**
```bash
vercel
```
Follow the prompts:
- **Set up and deploy**: Y
- **Which scope**: Your personal account
- **Link to existing project**: N
- **Project name**: laliga-del-fuego
- **Directory**: ./
- **Override settings**: N

**B. Add Environment Variables**
```bash
vercel env add ESPN_S2
# Paste: AEBikqIeYZqQSB78s2Qd%2Bo3AXTKWNG6qZum9bkULpljLg9fiavdj6x8JjU0Tp6Nk%2BG1TbOhbUqG5X6fmkLmjuZzeeR7qUWuum9%2FePph1vnApGQhr68DK656W3B4cqIZ9GRhqxoZJskDDCXC%2Bpj2A7xZK%2B%2BiExDaxUfWD0tnzsdmujN7QLlAl3RqaAL9A0FrFZh4USFT2h3n%2BbwULZBJwiQSA4Yuemx2b%2BnR880IPNlrxQ26CmmxxqM9j5xGy2fX9cvtxrw8Rg19Hme1GlogYZynhjd6lLv765y0EFCHsXwj%2FhWKu3Yx2oy%2BPVSWGY44My6E%3D
# Environment: Production

vercel env add ESPN_SWID
# Paste: {29F7B9A0-2C6B-464F-AC4D-65EA5A60686B}
# Environment: Production

vercel env add ESPN_LEAGUE_ID
# Paste: 789298
# Environment: Production

vercel env add MONGODB_URI
# Paste your MongoDB connection string from Phase 3
# Environment: Production
```

**C. Deploy to Production**
```bash
vercel --prod
```

### Step 4: Verify Deployment
**🧑‍💻 HUMAN TASK**: Test your deployed application:
1. Vercel will provide a URL (e.g., `https://laliga-del-fuego.vercel.app`)
2. Visit the URL and verify the dashboard loads
3. Check that API endpoints are working
4. Test on mobile device

## Phase 7: Ongoing Maintenance

### Step 1: Weekly Data Updates
**Automated via Vercel Cron Jobs**:
```javascript
// api/cron/weekly-update.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Trigger weekly ESPN data fetch
    // Update La Liga Bucks calculations
    // Store in MongoDB
    res.status(200).json({ success: true });
  }
}
```

### Step 2: Monitoring & Alerts
- **Vercel Analytics**: Track usage and performance
- **MongoDB Atlas Monitoring**: Database performance
- **ESPN API Health**: Monitor for API changes

### Step 3: Backup Strategy
- **MongoDB Atlas**: Automatic backups included in free tier
- **Code**: Git repository with multiple branches
- **Data Export**: Weekly export to CSV for redundancy

## Cost Analysis

### Free Tier Limits
- **Vercel Free**: 100GB bandwidth, 6,000 minutes serverless execution
- **MongoDB Atlas M0**: 512MB storage, 100 ops/sec
- **Total Monthly Cost**: $0

### Scaling Costs (if needed)
- **Vercel Pro**: $20/month (if free limits exceeded)
- **MongoDB Atlas M2**: $9/month (2GB storage, no connection limits)
- **Estimated Cost at Scale**: $29/month maximum

## Risk Mitigation

### Technical Risks
1. **ESPN API Changes**: 
   - Monitor API endpoints regularly
   - Implement fallback to manual data entry
   - Cache data for resilience

2. **Free Tier Limits**:
   - MongoDB: 512MB should handle 10+ seasons of data
   - Vercel: Monitor bandwidth usage during NFL season

3. **Performance Issues**:
   - Implement caching strategies
   - Optimize database queries
   - Use CDN for static assets

### Deployment Risks
1. **Environment Variables**: 
   - Double-check all secrets are properly set
   - Test in production-like environment first

2. **Database Connectivity**:
   - Verify MongoDB network access
   - Test connection from Vercel deployment

## Success Criteria

### Phase 1 Complete (Local Development)
- [ ] Dashboard loads locally with live data from API
- [ ] ESPN API integration working with test credentials  
- [ ] MongoDB connection established and data flowing
- [ ] All 7 navigation sections functional with backend

### Phase 2 Complete (Production Deployment)
- [ ] Site accessible at custom domain
- [ ] All API endpoints working in production
- [ ] Weekly data updates functioning
- [ ] Mobile experience optimized
- [ ] Admin panel accessible and secure

## Next Steps

1. **Initialize Project**: Set up package.json and basic API structure
2. **ESPN Integration**: Convert Python logic to JavaScript serverless functions
3. **Database Setup**: Configure MongoDB Atlas and create initial schema
4. **Local Testing**: Get full stack running locally
5. **Production Deploy**: Deploy to Vercel with proper environment configuration
6. **Data Migration**: Import historical 2024 season data
7. **Live Testing**: Verify all functionality in production environment

This plan provides a clear roadmap from current static dashboard to fully functional, deployed fantasy football application with minimal ongoing costs and maximum reliability.