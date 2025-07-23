# La Liga del Fuego - Product Requirements Document

## Executive Summary

La Liga del Fuego is a fantasy football dashboard web application designed to transform a 12-team ESPN-hosted fantasy league into an engaging, interactive experience. The application combines **authentic 90s video game aesthetics** (inspired by classic Madden NFL games) with modern web technologies to create a highly personalized, mobile-optimized platform that increases league engagement and fun factor through persistent authentication, AI-generated commentary, and real-time scoring updates.

**Primary Goal**: Increase total fun and engagement for league members through an interactive dashboard that goes far beyond standard fantasy football platforms.

## League Context & Background

### League Specifications
- **League Name**: La Liga del Fuego
- **Platform**: ESPN Fantasy Football (League ID: 789298)
- **Teams**: 12 teams with custom team names
- **Scoring**: Custom "La Liga Bucks" system (detailed below)
- **Prize Structure**: Weekly high scores earn $50, season-long competition
- **Users**: Close-knit friend group, highly personal/customized experience

### Current State Analysis
- **Legacy System**: Python scripts for ESPN API data collection (`legacy-python/`)
- **Previous Dashboard**: Excel-based static reporting with manual data entry
- **Generated MVP**: Feature-complete 90s video game styled dashboard in `laliga-final-trophy-dashboard/`
- **Preferred Aesthetic**: 90s video game style ("Hell yes! That looks much better!")

## Core Product Features

### 1. Dashboard/Leaderboard System
**Primary Interface**: Real-time La Liga Bucks standings

**Requirements**:
- Current week standings with live scoring updates
- Animated graph showing week-to-week seeding progress
- Historical week navigation (Weeks 1-17 selector)
- Sortable by multiple criteria: Total La Liga Bucks, ESPN rank, total points, earnings, playoff seed
- Visual breakdown of 2-component scoring system
- Mobile-optimized responsive design
- Click-through to individual team pages
- Dynamic team name capture from ESPN league page to reflect updates made my team owners
- 

**Success Criteria**:
- Users can quickly assess current league standings
- Historical performance easily accessible
- Clear understanding of La Liga Bucks calculation components

### 2. La Liga Bucks Scoring System
**Core Innovation**: 50/50 weighted scoring to determining playoff seeding
A tie is broken by higher Points-Against (who played against harder teams this season)

**Component Details**:
1. **ESPN Ranking Component** (1-12 points)
   - 1st place ESPN rank = 12 La Liga Bucks
   - 12th place ESPN rank = 1 La Liga Buck
   - Updated weekly based on ESPN's official rankings

2. **Cumulative Points Component** (1-12 points)
   - Highest total season points = 12 La Liga Bucks
   - Lowest total season points = 1 La Liga Buck
   - Encourages consistent high scoring throughout season

**Total Possible**: Max La Liga Bucks per team per week
**Integration**: Uses existing Python calculation logic from `legacy-python/main.py` as a reference only!
Legacy python used a 3-weight scoring system so it is technically not relevant anymore, but a good place to start. 

### 3. Money Board System
**Purpose**: Track weekly high score payouts and league earnings

**Requirements**:
- Weekly high score winners ($50 per high score)
- Running totals of individual owner earnings
- Prize pool visualization ($1,200 total league pot)
- Payout history timeline
- Visual charts showing earnings distribution
- Integration with La Liga Bucks performance

**Visual Style**: Retro digital readouts, classic arcade scoring format

### 4. Matchups Page
**Primary Function**: Game-day engagement hub

**User-Centric Features**:
- Default to current user's matchup
- Live scoring updates during NFL games
- Real-time La Liga Bucks component calculations
- Player-by-player scoring with projections vs actual

**League-Wide Features**:
- Interactive grid showing all current week matchups
- Quick navigation between different head-to-head battles
- Live playoff implications and seeding changes
- Historical head-to-head records

**Technical Requirements**:
- WebSocket implementation for real-time updates
- 2-3 minute update intervals during NFL games
- Mobile-first responsive design
- Graceful degradation without JavaScript

### 5. Individual Team Pages
**Access Methods**: Multiple navigation paths for user convenience
- Clickable leaderboard entries
- Search functionality with typeahead
- Dedicated team directory
- Direct URL routing

**Content Requirements**:
- Performance dashboard with historical trends
- Complete transaction timeline (waiver claims, trades)
- Head-to-head records against each opponent
- Remaining FAAB and spending patterns
- Current roster display
- La Liga Bucks progression charts

### 6. Champion & Sacko Banner System
**Visual Identity**: Scrolling banner animations for league personality

**Champion Banner (Top)**:
- Historical winners display (2020-2023 data available)
- Trophy icons with neon/pixelated styling
- Horizontal scrolling marquee animation
- Past champions: added via Admin page

**Sacko Banner (Bottom)**:
- League losers with humorous iconography
- "Game over" styling appropriate for 90s gaming aesthetic
- Same scrolling animation pattern
- Past Sackos: added via Admin page

### 7. AI Commentary System
**Purpose**: Generate smart-ass funny text about weekly happenings

**Data Sources**:
- ESPN fantasy data (matchup results, statistical performances, roster moves)
- NFL news APIs (current events, injury reports, game highlights)
- League transaction history (waiver claims, trades, lineup decisions)

**LLM Integration**:
- OpenAI GPT-4 or similar models
- Weekly commentary generation with personalized observations
- Smart-ass tone calibration (sarcastic, analytical, "bro-mode")
- Context-aware jokes referencing previous weeks and league rivalries
- Name-based roasting of specific owners

**Content Management**:
- Admin controls for commentary review/editing
- Archive of generated commentary for historical reference
- Integration with weekly results and performance data

### 8. User Authentication System
**Persistent Login Requirements**:
- Cookie-based authentication with configurable expiration
- Session token rotation for security
- "Remember Me" functionality for extended sessions
- No repeated login requirements

**ESPN API Integration**:
- Secure storage of ESPN S2 and SWID tokens
- API rate limiting and intelligent request throttling
- Fallback mechanisms for ESPN API unavailability
- Automatic token refresh capabilities

### 9. Administrative System
**Access Control**: Secure admin login for league management

**Data Management Features**:
- Historical champion/Sacko data entry forms
- Manual override capabilities for disputed calculations
- User management and league configuration tools
- ESPN API token management
- AI commentary moderation controls

## Technical Architecture

### Frontend Stack
- **Framework**: Vanilla JavaScript (no dependencies for maximum compatibility)
- **Layout**: CSS Grid/Flexbox for responsive design
- **Charts**: Chart.js integration for data visualization
- **Storage**: Local Storage for user preferences and admin sessions
- **Design**: Modular component architecture

### Backend Infrastructure
- **Primary**: Node.js with Express.js framework
- **API Integration**: ESPN fantasy football API with authentication
- **Scoring Engine**: Python logic integration via REST API or microservice
- **Real-time**: WebSocket server for live scoring updates
- **AI Pipeline**: OpenAI API integration for commentary generation

### Database Strategy
**Free Tier Requirements**: Must use free database solution

**Options Evaluated**:
1. **MongoDB Atlas (Free Tier)** - Recommended
   - Cloud-hosted, no server setup required
   - Good for JSON-like league data structures
   - Sufficient throughput for 12-team league

2. **PostgreSQL on Supabase (Free Tier)** - Alternative
   - Relational structure for complex queries
   - Built-in authentication capabilities
   - Modern dashboard interface

**Data Storage Requirements**:
- User profiles and authentication tokens
- Historical league data and cached ESPN responses
- AI-generated commentary archives
- Money tracking and payout history
- Champion/Sacko historical records

### ESPN API Integration
**Authentication**: Private league access via espn_s2 and SWID tokens
**Rate Limiting**: Intelligent throttling to avoid API restrictions
**Data Fetching**: Weekly matchups, scores, rosters, rankings, transactions
**Error Handling**: Graceful degradation for API unavailability

### Real-Time Features
**WebSocket Implementation**:
- Live scoring updates during NFL games (Thursday, Sunday, Monday)
- Push notifications for key scoring plays
- Real-time La Liga Bucks calculations
- Live playoff probability updates

**Update Frequency**:
- Every 30 seconds during active NFL games
- Every 5 minutes during non-game periods
- Batch updates to prevent interface overwhelm

## Design Requirements

### 90s Video Game Aesthetic
**Selected Design Direction**: Authentic 90s video game style inspired by classic Madden NFL games

**Color Palette**:
- **Primary**: Teal/turquoise (#20B2AA) - "unofficial color of the 90s"
- **Accent**: Bright magenta (#FF1493), electric purple (#8A2BE2)
- **Highlight**: Golden yellow (#FFD700)
- **Background**: Dark navy with subtle grid patterns
- **Philosophy**: Flat colors with high contrast, no glow effects

**Typography**:
- **Style**: Pixelated, blocky bitmap fonts
- **Approach**: Pixel-perfect grid alignment
- **Contrast**: High readability especially on mobile
- **Reference**: Classic arcade and console game fonts

**Interface Elements**:
- **Shape**: Rectangular containers with hard edges
- **Philosophy**: No rounded corners - pure 90s gaming UI
- **Buttons**: Large, rectangular with subtle 3D effects
- **Navigation**: Tab system resembling classic sports game menus

**Animation Style**:
- **Movement**: Sharp, instant state changes
- **Philosophy**: Digital, immediate feedback like classic games
- **Contrast**: No smooth flowing effects or light trails
- **Performance**: Hardware-accelerated where possible

### Mobile-First Design
**Touch Optimization**:
- Large tap targets for easy interaction
- Swipe navigation for matchup browsing
- Pinch-to-zoom for detailed charts
- Vertical-first layout with stacked content

**Performance Considerations**:
- Lazy loading for images and content
- Compressed assets and minified JavaScript
- Hardware-accelerated animations using transform/opacity
- Offline functionality via Service Workers

**Adaptive Elements**:
- Scalable pixelated graphics that maintain impact
- Simplified navigation for thumb-friendly use
- Contextual menus with slide-out panels
- Readable typography across all screen sizes

## Deployment & Infrastructure

### Perplexity Labs Deployment
**One-Click Deploy Requirements**:
- Full-stack app deployment (backend + frontend + database)
- Automatic provisioning of free tier cloud resources
- Custom code upload with integrated dependencies
- MongoDB Atlas or Supabase database connection

**Hosting Environment**:
- Managed cloud resources through Perplexity Labs
- Secure user session management
- Private admin tools for manual data triggers
- Environment variable management for API keys

### Performance Requirements
**Loading Times**:
- Initial page load: <3 seconds on mobile
- Navigation between sections: <500ms
- Live scoring updates: <2 seconds latency

**Scalability**:
- Support 12 concurrent users during peak times
- Handle 300-400% engagement increase on game days
- Graceful degradation under high load

**Browser Compatibility**:
- All modern browsers (Chrome, Safari, Firefox, Edge)
- Progressive enhancement for older browsers
- Fallback functionality without JavaScript

## Success Metrics & KPIs

### User Engagement
**Primary Metrics**:
- Daily active users during NFL season
- Session duration and page views per visit
- Return visitor rate throughout season
- Mobile vs desktop usage patterns

**Game Day Engagement**:
- Peak concurrent users during NFL games
- Average session length on Sundays
- Matchups page interaction rates
- Live scoring update engagement

### Feature Adoption
**Core Features**:
- La Liga Bucks calculation comprehension (user feedback)
- Week-to-week navigation usage
- Team page drill-down rates
- Admin feature utilization

**Advanced Features**:
- AI commentary engagement (likes, shares, comments)
- Money board interaction rates
- Champion/Sacko banner click-through
- Search and filter usage patterns

### Technical Performance
**System Reliability**:
- Uptime during NFL games (target: 99.9%)
- ESPN API integration success rate
- Real-time update delivery success
- Mobile performance metrics

## Future Enhancements

### Phase 2 Features
1. **Enhanced AI Commentary**:
   - League-specific meme integration
   - Historical reference capabilities
   - Customizable personality settings

2. **Advanced Analytics**:
   - Playoff probability calculations
   - Trade analysis and recommendations
   - Waiver wire impact assessment

3. **Social Features**:
   - Live chat during games
   - Team owner photo integration
   - League message board

### Phase 3 Expansions
1. **Multi-League Support**:
   - Support for multiple fantasy leagues
   - Cross-league comparisons
   - Unified user profiles

2. **Enhanced Mobile App**:
   - Push notifications for key events
   - Offline functionality
   - Native mobile app consideration

3. **Advanced Integrations**:
   - Twitter/social media integration
   - Streaming platform connections
   - Third-party fantasy tools

## Risk Mitigation

### Technical Risks
**ESPN API Changes**: Regular monitoring and fallback data sources
**Database Costs**: Free tier monitoring and optimization
**Performance Issues**: Load testing and caching strategies
**Security Concerns**: Regular token rotation and secure practices

### User Adoption Risks
**Learning Curve**: Comprehensive onboarding and tutorials
**Mobile Usage**: Extensive cross-device testing
**Feature Overwhelm**: Progressive feature rollout strategy

### Operational Risks
**Season Timing**: Pre-season launch and testing requirements
**Data Accuracy**: Multiple validation layers for calculations
**Admin Overhead**: Automated processes where possible

## Conclusion

La Liga del Fuego represents a comprehensive fantasy football dashboard that combines nostalgic 90s video game aesthetics with modern web application capabilities. The focus on user engagement, real-time interactivity, and personalized league experience positions it to significantly enhance the fantasy football experience for league members while providing a solid technical foundation for future enhancements.

The authentic 90s gaming design approach, combined with the sophisticated La Liga Bucks scoring system and AI-generated commentary, creates a unique product that goes far beyond traditional fantasy football tools to become a true league engagement platform.