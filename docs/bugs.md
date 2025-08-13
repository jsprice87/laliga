# Bugs

## Open Issues

### BUG-001: Team Names Not Properly Populated
**Priority**: High  
**Status**: Open  
**Description**: Team names are not being properly populated in the dashboard.  
**Impact**: Core functionality affected - team identification broken  
**Location**: Dashboard data population  

### BUG-002: No Account Creation System  
**Priority**: High  
**Status**: Open  
**Description**: No ability for users to create accounts.  
**Impact**: Users cannot access the system  
**Location**: Authentication system  

### BUG-004: Incorrect Prize Pool Configuration ✅
**Priority**: Medium  
**Status**: Resolved  
**Description**: Buy in is $200. Total pot should be $2400.  
**Resolution**: Prize pool already correctly configured to $2400 in app.js  
**Resolved Date**: 2025-08-12  

### BUG-005: Money Board Styling Issues ✅
**Priority**: Low  
**Status**: Resolved  
**Description**: Money board has unnecessary different colors for each bar and key that should be eliminated.  
**Resolution**: Updated money board chart colors to use consistent retrowave purple/cyan scheme  
**Resolved Date**: 2025-08-12  

### BUG-006: Commentary Page Readability ✅
**Priority**: Medium  
**Status**: Resolved  
**Description**: Commentary page is not very readable due to the text clashing with the background.  
**Resolution**: Enhanced commentary text readability with stronger contrast, more opaque background, and improved text shadows  
**Resolved Date**: 2025-08-12  

### BUG-007: Account Creation JSON Parse Error
**Priority**: High  
**Status**: Open  
**Description**: When creating an account: Unexpected token '<', "<!DOCTYPE "... is not valid JSON  
**Impact**: Users cannot create accounts - critical authentication failure  
**Location**: Account creation API/frontend integration  

### BUG-009: Replace Trophy Icon with 16-bit Flame ✅
**Priority**: Low  
**Status**: Resolved  
**Description**: Replace trophy icon in top left with 16-bit flame  
**Resolution**: Updated main dashboard icon to use flame-16bit.svg  
**Resolved Date**: 2025-08-12  

### BUG-010: Remove Flame Icons on Navigation Buttons ✅
**Priority**: Low  
**Status**: Resolved  
**Description**: Remove flame icons on navigation buttons  
**Resolution**: Flame icons already removed from navigation buttons  
**Resolved Date**: 2025-08-12  

### BUG-012: Leaderboard Only Shows Top 6 Places ✅
**Priority**: High  
**Status**: Resolved  
**Description**: Only top 6 places are being populated. Allow user to scroll through all places. Add retro vertical slicer bar on the right side of table  
**Resolution**: Leaderboard already has proper scrolling with retro-styled vertical scrollbar  
**Resolved Date**: 2025-08-12  

## Resolved Issues

### BUG-003: Incorrect Banner System ✅
**Priority**: Medium  
**Status**: Resolved  
**Description**: Sacko banner and Champions banner are incorrect. Those need to be customized fields added by Admin on Admin page.  
**Resolution**: Implemented hardcoded league-history.js file system for champions and sackos data. Banners now populate from this file correctly.  
**Resolved Date**: 2025-07-31

### BUG-008: Remove "New" Badges on Leaderboard ✅
**Priority**: Low  
**Status**: Resolved  
**Description**: Remove "new" badges on all lines of leaderboard  
**Resolution**: Removed all "new" badges from leaderboard display  
**Resolved Date**: 2025-08-06

### BUG-011: Leaderboard Table Column Alignment ✅
**Priority**: Medium  
**Status**: Resolved  
**Description**: Leaderboard table alignment not columns causing misalignment  
**Resolution**: Fixed leaderboard column alignment issues and simplified table structure  
**Resolved Date**: 2025-08-06

### BUG-013: Incorrect Maximum Liga Bucks Display ✅
**Priority**: High  
**Status**: Resolved  
**Description**: Top entry shows 31 Liga Bucks. Only 24 is possible (12+12)  
**Resolution**: Implemented new 2-component Liga Bucks calculation system (ESPN + Total Points, max 24 total)  
**Resolved Date**: 2025-08-06

### BUG-014: Incorrect Liga Bucks Category Labels ✅
**Priority**: Medium  
**Status**: Resolved  
**Description**: Category breakdown shows 3 liga buck types "ESPN" "Total" and "AVG". Should only be "ESPN" and "Total Points"  
**Resolution**: Updated to 2-component system showing only ESPN and Total Points components  
**Resolved Date**: 2025-08-06