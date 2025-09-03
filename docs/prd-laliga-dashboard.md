# Product Requirements Document: La Liga del Fuego Fantasy Football Dashboard

## Introduction/Overview

La Liga del Fuego is a comprehensive fantasy football league management web application that provides both live and historical data views for league participants. The application features a retro 90s video game aesthetic with 8/16-bit graphics and serves as the primary interface for viewing league standings, matchups, earnings, and detailed team analytics.

**Problem Statement:** League members need a centralized, mobile-friendly dashboard to track current season progress, view historical data spanning multiple years (2013-2025+), and understand the custom Liga Bucks scoring system that combines ESPN rankings with total points performance.

**Goal:** Create a fully functional year selection system and robust data management architecture that seamlessly handles both live ESPN API data and historical cached data.

## Goals

1. **Seamless Year Navigation**: Enable users to switch between any league year (2013-2025+) with appropriate data loading
2. **Reliable Data Management**: Implement robust system for live data vs historical data handling
3. **Liga Bucks Accuracy**: Ensure precise calculation and display of the two-component scoring system
4. **Mobile-First Experience**: Deliver consistent functionality across all device types
5. **Performance Optimization**: Fast loading for both live and cached data scenarios

## User Stories

### Year Selection & Navigation
- **As a league member**, I want to select any historical year from a dropdown so that I can review past season results
- **As a league member**, I want to see "CURRENT SEASON" vs "SEASON TOTALS" indicators so that I understand if I'm viewing live or historical data
- **As a mobile user**, I want year selection to work smoothly on my phone so that I can browse historical data anywhere

### Data Management & Loading
- **As a league member**, I want current season data to update in real-time so that I can track live scoring during games
- **As a league member**, I want historical data to load quickly so that I'm not waiting for old seasons to display
- **As a system administrator**, I want data to automatically transition from live to historical at week end so that records are preserved

### Liga Bucks Understanding
- **As a league member**, I want to see both components of Liga Bucks (ESPN rank + Total Points) so that I understand how scores are calculated
- **As a competitive player**, I want to see power bars showing the breakdown of my Liga Bucks so that I can strategize improvements
- **As a casual user**, I want Liga Bucks calculations to be consistent across all views so that I trust the scoring system

## Functional Requirements

### 1. Year Selection System
1.1. **Year Dropdown**: Display dropdown with available years (2013-2025+) in header
1.2. **Current Year Default**: System must default to current season (2025) on initial load
1.3. **Year Change Handling**: Switching years must reload all page data appropriately
1.4. **Status Indicators**: Display "CURRENT SEASON" for 2025, "SEASON TOTALS" for historical years
1.5. **URL State Management**: Year selection must persist in browser URL for bookmarking

### 2. Data Source Management
2.1. **Live Data Routing**: Current season (2025) data must pull from ESPN API with real-time updates
2.2. **Historical Data Routing**: Previous seasons (2013-2024) must pull from MongoDB cache
2.3. **Data Transition**: Live data must automatically cache to MongoDB at week end (Wednesday 9AM EST)
2.4. **Fallback Handling**: System must gracefully handle ESPN API failures with cached data
2.5. **Stat Corrections**: Final weekly data must be re-pulled Wednesday morning for ESPN stat corrections

### 3. Liga Bucks Calculation Engine
3.1. **Regular Season Only**: Liga Bucks calculations apply only to weeks 1-14 (regular season)
3.2. **ESPN Component**: Calculate 1-12 points based on win-loss record (ties broken by points-for)
3.3. **Points Component**: Calculate 1-12 points based on total season points ranking  
3.4. **Combined Score**: Liga Bucks = ESPN Component + Points Component (max 24, min 2)
3.5. **Tiebreaker Rule**: Liga Bucks ties are broken by Points Against (ascending - higher points against = lower rank)
3.6. **Historical Accuracy**: Liga Bucks must be calculated consistently for all historical weeks
3.7. **Real-time Updates**: Live Liga Bucks must update as games progress

### 4. Week Selection System & Season Structure
4.1. **Season Structure**: Regular season runs weeks 1-14, Playoffs run weeks 15-17
4.2. **Current Week Default**: Matchups page must default to current active week
4.3. **Week Navigation**: Users must be able to select weeks 1-17 via dropdown
4.4. **Data Source Switching**: Current week loads live data, previous weeks load cached data
4.5. **Week Status Display**: Show "LIVE" vs "FINAL" indicators based on data source
4.6. **Mobile Week Selection**: Week selector must work effectively on mobile devices

### 5. Page-Specific Functionality

#### 5.1 Leaderboard Page
- Display team rankings with seed, record, points, and Liga Bucks
- Show Liga Bucks breakdown with visual power bars (two-tone for components)
- Include week-to-week rank change indicators
- Display large trophy image alongside leaderboard
- Show Liga Bucks progression chart for regular season (weeks 1-14) with no tied rankings

#### 5.2 Matchups Page
- Display 6 matchup cards showing all 12 teams
- Show team logos, names, records, and current/final scores
- Include week selector with live vs historical data loading
- Display matchup status (scheduled/in-progress/final)

#### 5.3 Money Board Page
- Track weekly high scorer earnings ($50 per week)
- Display cumulative earnings table for all teams
- Show earnings bar chart visualization
- List weekly high scorers for weeks 1-17

#### 5.4 Teams Page
- Display team grid with basic stats
- Enable click-through to detailed team modal
- Show individual team Liga Bucks progression
- Include team-specific analytics and trends

#### 5.5 Rules Page
- Display Liga Bucks scoring explanation
- Show league rules and payout structure
- Provide calculation examples
- Static content, no data dependencies

### 6. Mobile Responsiveness
6.1. **Responsive Design**: All pages must work effectively on mobile devices
6.2. **Touch Optimization**: Dropdowns and selectors must be mobile-friendly
6.3. **Performance**: Mobile loading times must not exceed 3 seconds
6.4. **Navigation**: Mobile navigation must be intuitive and accessible
6.5. **Data Display**: Tables and charts must adapt to mobile screen sizes

### 7. Banner System
7.1. **Champions Banner**: Display historical champions across top (hardcoded data)
7.2. **Sacko Banner**: Display historical last-place finishers across bottom (hardcoded data)
7.3. **Visual Separators**: Use trophy images between champions, poop emoji between sackos
7.4. **Persistent Display**: Banners must appear on all pages regardless of selected year

## Non-Goals (Out of Scope)

- **Design Changes**: Existing retrowave styling and visual theme will remain unchanged
- **New Page Types**: No additional pages beyond the six existing page types
- **User Authentication**: No login/user management system required
- **Data Entry Interface**: No manual data entry or admin editing capabilities
- **Social Features**: No commenting, messaging, or social interaction features
- **Push Notifications**: No mobile app notifications or alerts
- **Third-party Integrations**: No integrations beyond ESPN API
- **Advanced Analytics**: No predictive analytics or advanced statistical modeling

## Technical Considerations

### API Integration
- **ESPN API**: Real-time data pulls for current season with rate limiting consideration
- **MongoDB Integration**: Efficient queries for historical data retrieval
- **Caching Strategy**: Smart caching to minimize API calls while maintaining data freshness
- **Error Handling**: Robust error handling for API failures and data inconsistencies

### Database Schema
- **Teams Collection**: Store team metadata, seasonal stats, and Liga Bucks calculations
- **Matchups Collection**: Store weekly matchup results and scoring data
- **League Collection**: Store season-level metadata and configuration
- **Indexing**: Proper indexing for efficient year/week-based queries

### Performance Requirements
- **Initial Load**: Page load time must not exceed 2 seconds for cached data
- **Year Switching**: Year changes must complete within 1 second
- **Mobile Performance**: Touch interactions must be responsive (<100ms)
- **Data Refresh**: Live data updates must not cause UI freezing

## Design Considerations

**Existing Design Preservation**: The current retrowave aesthetic, color scheme, and 8/16-bit graphics theme must remain unchanged. All functionality improvements must work within the existing visual framework.

**Component Integration**: New functionality must integrate seamlessly with existing CSS classes and component structures without requiring visual redesign.

## Success Metrics

### Functional Success
- **Year Selection**: 100% success rate for year switching across all browsers
- **Data Accuracy**: Liga Bucks calculations match manual verification for all historical data
- **Mobile Usage**: 95% of mobile interactions complete successfully
- **Load Performance**: 90% of page loads complete within performance targets

### User Experience Success
- **Feature Adoption**: 80% of users utilize year selection within first session
- **Data Trust**: Zero user-reported calculation errors or data inconsistencies
- **Mobile Engagement**: Mobile usage represents >40% of total traffic
- **Error Rate**: <1% of user sessions encounter data loading errors

### Technical Success
- **API Reliability**: 99% uptime for ESPN API integration with proper fallback handling
- **Data Consistency**: 100% consistency between live and cached data calculations
- **Performance Compliance**: 95% of interactions meet performance targets
- **Browser Compatibility**: Full functionality across all modern browsers

## Open Questions

1. **Data Migration**: How should existing inconsistent historical data be handled during implementation?
2. **API Rate Limits**: What are the specific ESPN API rate limits and how should they be managed?
3. **Playoff Bracket**: Should the playoff bracket functionality be included in this phase or deferred?
4. **Data Validation**: What validation should be implemented for ESPN API data quality?
5. **Backup Strategy**: What backup data sources should be available if ESPN API becomes unavailable?
6. **Performance Monitoring**: What monitoring should be implemented to track the success metrics?
7. **Error Logging**: What level of error logging and alerting is required for production?

## Implementation Priority

### Phase 1 (Critical)
- Year selection dropdown and state management
- Data source routing (live vs historical)
- Liga Bucks calculation accuracy
- Basic mobile responsiveness

### Phase 2 (Important)  
- Week selection system
- Performance optimization
- Error handling and fallbacks
- Banner system improvements

### Phase 3 (Enhancement)
- Advanced mobile optimizations
- Detailed analytics and charts
- Performance monitoring
- Additional error handling scenarios