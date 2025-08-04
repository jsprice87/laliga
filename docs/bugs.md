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

### BUG-003: Incorrect Banner System
**Priority**: Medium  
**Status**: Open  
**Description**: Sacko banner and Champions banner are incorrect. Those need to be customized fields added by Admin on Admin page.  
**Impact**: Wrong winners/losers displayed  
**Location**: Banner display logic  

### BUG-004: Incorrect Prize Pool Configuration
**Priority**: Medium  
**Status**: Open  
**Description**: Buy in is $200. Total pot should be $2400.  
**Impact**: Financial calculations incorrect  
**Location**: Prize pool configuration  

### BUG-005: Money Board Styling Issues
**Priority**: Low  
**Status**: Open  
**Description**: Money board has unnecessary different colors for each bar and key that should be eliminated.  
**Impact**: Visual clutter  
**Location**: Money board component styling  

### BUG-006: Commentary Page Readability
**Priority**: Medium  
**Status**: Open  
**Description**: Commentary page is not very readable due to the text clashing with the background.  
**Impact**: Poor user experience  
**Location**: Commentary page styling  

### BUG-007: Account Creation JSON Parse Error
**Priority**: High  
**Status**: Open  
**Description**: When creating an account: Unexpected token '<', "<!DOCTYPE "... is not valid JSON  
**Impact**: Users cannot create accounts - critical authentication failure  
**Location**: Account creation API/frontend integration  

### BUG-008: Remove "New" Badges on Leaderboard
**Priority**: Low  
**Status**: Open  
**Description**: Remove "new" badges on all lines of leaderboard  
**Impact**: Visual clutter, unnecessary UI elements  
**Location**: Leaderboard component  

### BUG-009: Replace Trophy Icon with 16-bit Flame
**Priority**: Low  
**Status**: Open  
**Description**: Replace trophy icon in top left with 16-bit flame  
**Impact**: Brand consistency  
**Location**: Dashboard header  

### BUG-010: Remove Flame Icons on Navigation Buttons
**Priority**: Low  
**Status**: Open  
**Description**: Remove flame icons on navigation buttons  
**Impact**: Visual consistency  
**Location**: Navigation component  

### BUG-011: Leaderboard Table Column Alignment
**Priority**: Medium  
**Status**: Open  
**Description**: Leaderboard table alignment not columns causing misalignment  
**Impact**: Poor table readability and visual presentation  
**Location**: Leaderboard table styling  

### BUG-012: Leaderboard Only Shows Top 6 Places
**Priority**: High  
**Status**: Open  
**Description**: Only top 6 places are being populated. Allow user to scroll through all places. Add retro vertical slicer bar on the right side of table  
**Impact**: Cannot view all team rankings  
**Location**: Leaderboard data rendering and scrolling  

### BUG-013: Incorrect Maximum Liga Bucks Display
**Priority**: High  
**Status**: Open  
**Description**: Top entry shows 31 Liga Bucks. Only 24 is possible (12+12)  
**Impact**: Data integrity issue, incorrect scoring display  
**Location**: Liga Bucks calculation logic  

### BUG-014: Incorrect Liga Bucks Category Labels
**Priority**: Medium  
**Status**: Open  
**Description**: Category breakdown shows 3 liga buck types "ESPN" "Total" and "AVG". Should only be "ESPN" and "Total Points"  
**Impact**: Confusing user interface, incorrect labeling  
**Location**: Liga Bucks breakdown display  

## Resolved Issues

### BUG-003: Incorrect Banner System ✅
**Priority**: Medium  
**Status**: Resolved  
**Description**: Sacko banner and Champions banner are incorrect. Those need to be customized fields added by Admin on Admin page.  
**Resolution**: Implemented hardcoded league-history.js file system for champions and sackos data. Banners now populate from this file correctly.  
**Resolved Date**: 2025-07-31