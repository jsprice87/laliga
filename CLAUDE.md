# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

La Liga del Fuego is a fantasy football league management system with two main components:
1. **Legacy Python Scripts** (archived): Original ESPN API data collection and league scoring calculations
2. **Web Dashboard** (active): Feature-complete interactive retrowave-styled fantasy football dashboard

## Project Structure

### Active Development (`/laliga-final-trophy-dashboard/`)
**This is the main project - focus development efforts here**
- `index.html` (376 lines): Complete SPA structure with 7 navigation sections
- `style.css` (1,846 lines): Comprehensive retrowave design system with CSS custom properties
- `app.js` (1,135 lines): Full application logic with ~30 functions for all features
- `la_liga_bucks_progression.csv`: Sample data for Chart.js integration
- `*.png`: Trophy and logo assets (S3-hosted external images)

### Legacy Python System (`/legacy-python/`)
**Reference only - archived original implementation**
- `main.py`: ESPN API data collection with "Butler Math" calculations
- `config.py`: ESPN API credentials (espn_s2, swid tokens, league_id)
- `results/`: Historical CSV files with weekly standings and game data
- `createSheet.py`: Google Sheets integration

### Documentation (`/docs/`)
- `seed_conversation.md`: Reference to original Perplexity conversation
- `dashboard_analysis.md`: Complete technical analysis of dashboard features

## Core Commands

### Web Dashboard (Primary Development)
```bash
# Navigate to main project
cd laliga-final-trophy-dashboard

# Open dashboard in browser (no build process needed)
open index.html

# Live development server (optional)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Legacy Python Scripts (Reference)
```bash
# Navigate to legacy system
cd legacy-python

# Run original data collection
python3 main.py

# Create Google Sheets
python3 createSheet.py
```

## Dashboard Features (All Implemented)

### Navigation Sections
1. **Leaderboard**: Sortable La Liga Bucks standings with component breakdown
2. **Matchups**: Week-by-week head-to-head results and scheduling
3. **Teams**: Individual team profiles with detailed analytics
4. **Money Board**: Prize pool tracking and earnings visualization
5. **Commentary**: League news and weekly recaps framework
6. **Rules**: La Liga Bucks scoring system explanation
7. **Admin**: Secure panel for data management and historical entries

### Interactive Features
- **Week selector** (1-17) with current week indicators
- **Sortable tables** by multiple criteria (bucks, ESPN rank, points, earnings)
- **Team modal popups** with detailed statistics and progression charts
- **Mobile-responsive design** with touch optimization
- **Admin system** with login/logout and data management tools
- **Dynamic banners** for champions and last place (Sacko) tracking

## Technical Architecture

### Frontend Stack
- **Vanilla JavaScript**: Maximum compatibility, no framework dependencies
- **CSS Grid/Flexbox**: Advanced responsive layout system
- **Chart.js**: Integrated for team progression and earnings visualization
- **Local Storage**: Admin session persistence

### Design System
- **Retrowave aesthetic**: Deep space blacks, electric cyan, hot pink, neon green
- **Orbitron typography**: Retro-futuristic fonts with glow effects
- **CSS Custom Properties**: Comprehensive design token system (~100 variables)
- **Component-based styling**: Modular classes for consistent UI

### Data Architecture
```javascript
appData = {
  league: { name, currentWeek, totalWeeks, teams, prizePool, weeklyBonus },
  teams: [{ id, name, record, totalPoints, laLigaBucks, espnComponent, ... }],
  matchups: [{ week, team1, team2, team1Score, team2Score, status }],
  champions: [{ year, winner }], 
  sackos: [{ year, loser }]
}
```

## La Liga Bucks Scoring System

**Three-component system (1-12 points each, max 36 total):**
1. **ESPN Component**: Points based on ESPN fantasy rankings (12 for 1st, 1 for 12th)
2. **Cumulative Component**: Points based on total season points (12 for highest, 1 for lowest)  
3. **Weekly Average Component**: Points based on average weekly point rankings (Butler Math)

**Tiebreaker**: Total Points For across the season

## Development Workflow

### Current Status
- **Dashboard is feature-complete** with static demo data
- **All UI/UX components implemented** and functional
- **Mobile optimization complete**
- **Admin tools ready** for data management

### Next Development Steps
1. **Replace static data** with dynamic data source (API or CSV import)
2. **Connect legacy Python scripts** for real-time ESPN data
3. **Add database layer** for data persistence
4. **Implement live updates** during game weeks

### Integration Notes
- **Dashboard expects specific data format** matching current JavaScript objects
- **CSV import capability** already implemented for team progression data
- **Chart.js integration** ready for dynamic data visualization
- **Error handling** needs implementation for production deployment

## Deployment

### Ready for Static Hosting
- **No server-side dependencies** (except Chart.js CDN)
- **Self-contained HTML/CSS/JS** files
- **External assets**: S3-hosted images require HTTPS
- **Mobile-optimized**: Responsive across all device sizes

### Development Server
```bash
cd laliga-final-trophy-dashboard
python3 -m http.server 8000
# Dashboard accessible at http://localhost:8000
```

## Key Files to Understand

- `app.js:280-400`: Core utility functions and team data management
- `app.js:440-580`: Navigation and week selector systems  
- `app.js:620-720`: Team and matchup rendering logic
- `style.css:1-100`: CSS custom properties and design tokens
- `index.html:80-150`: Main navigation and section structure

Focus development efforts on the `/laliga-final-trophy-dashboard/` directory - this is a complete, modern fantasy football dashboard ready for deployment and data integration.