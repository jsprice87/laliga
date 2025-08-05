# Updated Current Tasks - Prioritized by Impact

## Project Status Summary

**Authentication System**: Removed per user request - system now uses hardcoded data files approach
**Banner System**: ✅ COMPLETED - Now uses league-history.js for champions/sackos data
**Main Focus**: Simple UI improvements and bug fixes before major feature development

## High Priority Tasks (Start Here)

### 1.0 Fix Critical UI Issues ⚡
- [ ] 1.1 Fix browser tab title - remove "90s video games" reference (FEAT-009) 
- [ ] 1.2 Update favicon to trophy-small.png (FEAT-007)
- [ ] 1.3 Update main dashboard icon to trophy-medium.png (FEAT-008)
- [ ] 1.4 Fix prize pool configuration to $200 buy-in, $2400 total pot (BUG-004)
- [ ] 1.5 Clean up Money Board styling - remove unnecessary colors (BUG-005)

### 2.0 Fix API/Backend Issues 🔧
- [ ] 2.1 Fix account creation JSON parse error (BUG-007)
- [ ] 2.2 Resolve API server timeout and connection issues
- [ ] 2.3 Fix ESPN API integration for live data loading

### 3.0 Enhance User Experience 📊  
- [ ] 3.1 Improve Commentary page readability - fix text/background clash (BUG-006)
- [ ] 3.2 Add leaderboard progress bars showing Liga Bucks breakdown (FEAT-010)
- [ ] 3.3 Implement ranking change indicators with up/down arrows (FEAT-006)

## Medium Priority Tasks

### 4.0 Major Feature Development 🚀
- [ ] 4.1 Create comprehensive League Rules page (FEAT-005)
- [ ] 4.2 Design playoff bracket page layout with retrowave styling (FEAT-001)
- [ ] 4.3 Implement Sacko bracket system (FEAT-002)
- [ ] 4.4 Create HTML email invitation template (FEAT-003)

## Completed ✅
- [x] Banner system - Champions and Sackos now populate from league-history.js (BUG-003)
- [x] Authentication system removal - simplified to hardcoded data approach
- [x] Banner scrolling speed - reduced to half speed per user request

## Files to Focus On

### Quick Fixes (Tasks 1.0-3.0):
- `index.html` - Browser title, favicon, main icon
- `style.css` - Money board colors, commentary readability  
- `app.js` - Prize pool values, progress bars, ranking indicators
- `api/index.js` - API error handling and JSON responses

### Major Features (Task 4.0):
- New files: `rules.html`, `playoff-bracket.html`, `invite-email.html`
- Enhanced styling and JavaScript functionality

## Next Steps

1. **Start with Task 1.0** - Quick UI fixes that provide immediate visual improvements
2. **Push to production** after completing each major task section  
3. **Test thoroughly** before moving to next major task
4. **Focus on simplicity** - avoid complex authentication systems per user feedback