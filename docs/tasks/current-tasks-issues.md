# Current Tasks - Consolidated Issues List

## Project Status Summary

**Layout Updates**: ✅ COMPLETED - New dashboard layout with large trophy and flame navigation icons
**Authentication System**: Removed per user request - system uses hardcoded data files
**Banner System**: ✅ COMPLETED - Uses league-history.js for champions/sackos data  
**Main Focus**: Critical bug fixes and UI improvements before major feature development

## Relevant Files

### Core UI Files
- `laliga-final-trophy-dashboard/index.html` - Main HTML structure, browser title, favicon, dashboard icons
- `laliga-final-trophy-dashboard/style.css` - Styling fixes for money board, commentary readability, progress bars
- `laliga-final-trophy-dashboard/app.js` - Prize pool configuration, team data, progress bars, ranking indicators
- `trophy-small.png` - Favicon replacement file
- `trophy-medium.png` - Main dashboard icon file

### API/Backend Files  
- `api/index.js` - Account creation error handling, JSON response fixes
- `api/server.js` - Server configuration and API routing
- `api/auth/temp-auth.js` - Authentication system fixes

### New Feature Files
- `laliga-final-trophy-dashboard/rules.html` - Comprehensive league rules page (to be created)
- `laliga-final-trophy-dashboard/playoff-bracket.html` - Playoff bracket visualization (to be created)  
- `laliga-final-trophy-dashboard/playoff-bracket.js` - Bracket functionality (to be created)
- `templates/invite-email.html` - HTML email invitation template (to be created)

### Notes
- Focus on simple UI improvements before complex features
- Test after each major task completion
- Push to production after completing each section

## Tasks

- [ ] 1.0 **Critical UI Fixes** ⚡ (High Priority)
  - [ ] 1.1 Fix browser tab title - remove "90s video games" reference (FEAT-009)
  - [ ] 1.2 Update favicon to trophy-small.png (FEAT-007) 
  - [ ] 1.3 Update main dashboard icon to trophy-medium.png (FEAT-008)
  - [ ] 1.4 Fix prize pool configuration to $200 buy-in, $2400 total (BUG-004)
  - [ ] 1.5 Clean up Money Board styling - remove unnecessary colors (BUG-005)

- [ ] 2.0 **API/Backend Error Resolution** 🔧 (High Priority)
  - [ ] 2.1 Fix account creation JSON parse error (BUG-007)
  - [ ] 2.2 Resolve API server timeout and connection issues
  - [ ] 2.3 Fix ESPN API integration for live data loading
  - [ ] 2.4 Fix team names not properly populated (BUG-001)

- [ ] 3.0 **User Experience Enhancements** 📊 (Medium Priority)
  - [ ] 3.1 Improve Commentary page readability - fix text/background clash (BUG-006) 
  - [ ] 3.2 Add leaderboard progress bars showing Liga Bucks breakdown (FEAT-010)
  - [ ] 3.3 Implement ranking change indicators with up/down arrows (FEAT-006)
  - [ ] 3.4 Fix banner system for admin-customizable champions/sackos (BUG-003)

- [ ] 4.0 **Major Feature Development - Brackets** 🏆 (Medium Priority)
  - [ ] 4.1 Design playoff bracket page layout with retrowave styling (FEAT-001)
  - [ ] 4.2 Implement playoff bracket logic and live updates
  - [ ] 4.3 Add Sacko bracket system for bottom teams (FEAT-002)
  - [ ] 4.4 Create interactive bracket navigation and state management

- [ ] 5.0 **Major Feature Development - Admin & Communication** 👑 (Low Priority)
  - [ ] 5.1 Create comprehensive League Rules page (FEAT-005)
  - [ ] 5.2 Design HTML email invitation template matching site styling (FEAT-003)
  - [ ] 5.3 Enhance admin system for full data management (FEAT-004)
  - [ ] 5.4 Implement invitation system with account creation workflow

## Immediate Action Plan

**START HERE**: Begin with Task 1.0 (Critical UI Fixes) - these provide immediate visual improvements with minimal complexity.

**After Task 1.0**: Push to production for testing, then proceed to Task 2.0 (API fixes).

**Testing Strategy**: Complete all subtasks within a major task before moving to the next major task. Test and push after each major section.

**Current Priority**: Focus on simplicity and visual polish over complex backend features per user feedback.