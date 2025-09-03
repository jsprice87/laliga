# Task List: La Liga del Fuego Fantasy Football Dashboard

Generated from: `prd-laliga-dashboard.md`

## Relevant Files

- `public/js/core/state.js` - Core application state management for year/week selection
- `public/js/core/api-client.js` - API client for ESPN and MongoDB data routing
- `public/js/services/data-service.js` - Data service for live vs historical data handling
- `public/js/components/header.js` - Header component containing year selection dropdown
- `public/js/components/leaderboard.js` - Leaderboard component with Liga Bucks display
- `public/js/components/matchups.js` - Matchups component with week selection
- `public/js/utils/liga-bucks-calculator.js` - Liga Bucks calculation engine
- `api/controllers/teamsController.js` - API controller for team data management
- `api/controllers/matchupsController.js` - API controller for matchup data management
- `api/utils/dataRouter.js` - Data routing logic for live vs historical sources
- `public/js/main.js` - Main application initialization and year change handling

### Notes

- Focus on functional requirements from PRD Phase 1 (Critical)
- Preserve existing retrowave styling and component structure
- Target junior developer implementation with clear, actionable tasks
- Prioritize year selection and data management core functionality

## Tasks

- [ ] 1.0 Implement Year Selection System
- [ ] 2.0 Create Data Source Routing Architecture  
- [ ] 3.0 Build Liga Bucks Calculation Engine
- [ ] 4.0 Implement Week Selection System
- [ ] 5.0 Update Page Components for Year/Week Integration
- [ ] 6.0 Add Mobile Responsiveness and Performance Optimization