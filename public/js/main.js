/**
 * La Liga del Fuego - Main Application Entry Point
 * Modern ES6+ modular architecture
 * 
 * This is the main entry point that orchestrates all frontend modules
 * and replaces the monolithic app.js structure.
 */

// Import core modules
import { AppState } from './core/state.js';
import { APIClient } from './core/api-client.js';
import { Router } from './core/router.js';
import { Logger } from './utils/logger.js';

// Import UI components
import { Navigation } from './components/navigation.js';
import { Header } from './components/header.js';
import { Leaderboard } from './components/leaderboard.js';
import { Matchups } from './components/matchups.js';
import { Teams } from './components/teams.js';
import { PlayoffBracket } from './components/playoff-bracket.js';
import { MoneyBoard } from './components/money-board.js';
import { Rules } from './components/rules.js';
import { Modal } from './components/modal.js';

// Import services
import { DataService } from './services/data-service.js';
import { BannerService } from './services/banner-service.js';
import { SoundService } from './services/sound-service.js';

/**
 * Main Application Class
 * Coordinates all modules and manages application lifecycle
 */
class LaLigaApp {
  constructor() {
    this.logger = new Logger('LaLigaApp');
    this.state = new AppState();
    this.api = new APIClient();
    this.router = new Router();
    
    // Initialize services
    this.dataService = new DataService(this.api, this.state);
    this.bannerService = new BannerService(this.state);
    this.soundService = new SoundService();
    
    // Initialize components
    this.components = {
      navigation: new Navigation(this.state),
      header: new Header(this.state),
      leaderboard: new Leaderboard(this.state, this.dataService),
      matchups: new Matchups(this.state, this.dataService),
      teams: new Teams(this.state, this.dataService),
      playoffBracket: new PlayoffBracket(this.state, this.dataService),
      moneyBoard: new MoneyBoard(this.state, this.dataService),
      rules: new Rules(),
      modal: new Modal(this.state)
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      this.logger.info('🚀 Initializing La Liga del Fuego Dashboard...');
      
      // Initialize URL state management first
      this.initializeURLState();
      
      // Get year from URL or default to 2025
      const urlYear = this.getYearFromURL();
      this.state.setCurrentYear(urlYear || 2025);
      
      // Initialize core systems
      await this.initializeCore();
      
      // Initialize UI components
      this.initializeComponents();
      
      // Load initial data
      await this.loadInitialData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize routing
      this.setupRouting();
      
      this.logger.info('✅ Application initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize application:', error);
      this.showFatalError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Initialize core application systems
   */
  async initializeCore() {
    // Initialize API client
    await this.api.init();
    
    // Initialize state with default league settings
    this.state.initialize({
      league: {
        name: "La Liga del Fuego",
        currentWeek: 1,
        totalWeeks: 17,
        teams: 12,
        prizePool: 2400,
        weeklyBonus: 50,
        season: 2025
      },
      teams: [],
      matchups: [],
      championsHistory: [
        { year: 2024, team: "Matthew C Kelsall", owner: "Matthew C Kelsall" },
        { year: 2023, team: "Scott A Williams", owner: "Scott A Williams" },
        { year: 2022, team: "Stephen L Parr", owner: "Stephen L Parr" },
        { year: 2021, team: "Stephen L Parr", owner: "Stephen L Parr" },
        { year: 2019, team: "Justin S Price", owner: "Justin S Price" },
        { year: 2018, team: "Justin S Price", owner: "Justin S Price" },
        { year: 2017, team: "Justin S Price", owner: "Justin S Price" },
        { year: 2016, team: "Scott A Williams", owner: "Scott A Williams" },
        { year: 2015, team: "Evan A Lengrich", owner: "Evan A Lengrich" },
        { year: 2014, team: "Jeffrey L Parr", owner: "Jeffrey L Parr" },
        { year: 2013, team: "Justin S Price", owner: "Justin S Price" }
      ],
      sackoHistory: [
        { year: 2024, team: "Shteebe Bogey", owner: "Shteebe Bogey" },
        { year: 2023, team: "Un-Evan Languish", owner: "Un-Evan Languish" },
        { year: 2022, team: "Kwiss McKissass", owner: "Kwiss McKissass" },
        { year: 2021, team: "Justine Prissy", owner: "Justine Prissy" },
        { year: 2019, team: "Adum Limpwood", owner: "Adum Limpwood" },
        { year: 2018, team: "Eric Butthurt", owner: "Eric Butthurt" },
        { year: 2017, team: "Adum Limpwood", owner: "Adum Limpwood" },
        { year: 2016, team: "Justine Prissy", owner: "Justine Prissy" },
        { year: 2015, team: "Eric Butthurt", owner: "Eric Butthurt" },
        { year: 2014, team: "Nik'less Murky", owner: "Nik'less Murky" }
      ]
    });
  }

  /**
   * Initialize all UI components
   */
  initializeComponents() {
    Object.values(this.components).forEach(component => {
      if (component.init) {
        component.init();
      }
    });
  }

  /**
   * Load initial application data
   */
  async loadInitialData() {
    const currentYear = this.state.getCurrentYear();
    
    if (currentYear === 2025) {
      // For 2025, show zeros if no data exists
      await this.loadCurrentSeasonData();
    } else {
      // Load historical data for other years
      await this.loadHistoricalData(currentYear);
    }
    
    // Update banners
    this.bannerService.updateBanners();
  }

  /**
   * Load current season data (2025) with zero fallbacks
   */
  async loadCurrentSeasonData() {
    try {
      const data = await this.dataService.loadLiveData(2025);
      
      if (data && data.teams && data.teams.length > 0) {
        this.state.setTeams(data.teams);
        this.state.setMatchups(data.matchups || []);
        this.state.setCurrentWeek(data.currentWeek || 1);
      } else {
        // No data for 2025 - show zeros
        this.showSeasonNotStarted();
      }
      
    } catch (error) {
      this.logger.warn('No live data available for 2025, showing season not started state');
      this.showSeasonNotStarted();
    }
  }

  /**
   * Show "season not started" state with zeros
   */
  showSeasonNotStarted() {
    const emptyTeams = this.generateEmptyTeamData();
    this.state.setTeams(emptyTeams);
    this.state.setMatchups([]);
    this.state.setCurrentWeek(1);
    
    // Update UI to show "season not started" indicators
    this.updateSeasonStatus('SEASON NOT STARTED');
    
    // Update banners with historical data (should show regardless of current season status)
    this.bannerService.updateBanners();
  }

  /**
   * Generate empty team data with zeros for 2025
   */
  generateEmptyTeamData() {
    const teamNames = [
      "Kris P. Roni", "Blondes Give Me A Chubb", "Team Epsilon", 
      "Murican Futball Crusaders", "Blue Line", "Purple Reign",
      "Hurts in the Brown Bachs", "The Peeping Tomlins", "CTE Ain't Nothing",
      "Nothing to CTE Here", "Vonnies Chubbies", "Fire My Cannons"
    ];
    
    return teamNames.map((name, index) => ({
      id: index + 1,
      name: name,
      owner: "TBD",
      record: { wins: 0, losses: 0, ties: 0 },
      totalPoints: 0,
      espnRank: index + 1,
      playoffSeed: index + 1,
      laLigaBucks: 0,
      espnComponent: 0,
      cumulativeComponent: 0,
      weeklyAverageComponent: 0,
      earnings: 0,
      weeklyHighScores: 0
    }));
  }

  /**
   * Load historical data for previous years
   */
  async loadHistoricalData(year) {
    try {
      console.group(`🔍 LOADING HISTORICAL DATA FOR ${year}`);
      console.log(`Starting loadHistoricalData for ${year} - using direct API bypass`);
      
      // BYPASS: Load data directly from API to avoid DataService processing issues
      const apiData = await this.api.getTeamsHistorical(year);
      console.log(`Direct API call successful, raw API response:`, apiData);
      
      // DEBUG: Check Liga Bucks values specifically
      if (apiData && apiData.teams && apiData.teams.length > 0) {
        console.log(`🏈 MAIN.JS LIGA BUCKS CHECK - First team:`, {
          name: apiData.teams[0].name,
          laLigaBucks: apiData.teams[0].laLigaBucks,
          espnComponent: apiData.teams[0].espnComponent,
          cumulativeComponent: apiData.teams[0].cumulativeComponent
        });
      }
      
      // Check if API returned teams array vs wrapper object
      const teamsArray = apiData?.teams || apiData;
      console.log(`Teams array extracted:`, teamsArray);
      console.log(`Loaded ${Array.isArray(teamsArray) ? teamsArray.length : 0} teams`);
      
      if (teamsArray && Array.isArray(teamsArray)) {
        // DEBUG: Check first team's Liga Bucks structure
        if (teamsArray.length > 0) {
          console.log('🔍 MAIN.JS DEBUG - First team raw data:', {
            name: teamsArray[0].name,
            laLigaBucks: teamsArray[0].laLigaBucks,
            laLigaBucksType: typeof teamsArray[0].laLigaBucks,
            espnComponent: teamsArray[0].espnComponent,
            cumulativeComponent: teamsArray[0].cumulativeComponent
          });
        }
        
        // Process teams with simple mapping to avoid circular references
        const processedTeams = teamsArray.map(team => {
          // DEBUG: Log the processing for each team
          console.log(`🔄 PROCESSING Team ${team.name}:`, {
            rawLaLigaBucks: team.laLigaBucks,
            rawLaLigaBucksType: typeof team.laLigaBucks,
            hasLaLigaBucksTotal: !!team.laLigaBucks?.total,
            rawEspnComponent: team.espnComponent,
            rawCumulativeComponent: team.cumulativeComponent
          });
          
          const processedTeam = {
            id: team.espnId || team.id,
            name: team.name,
            owner: team.owner,
            abbrev: team.abbrev,
            logo: team.logo,
            record: team.record,
            totalPoints: team.totalPoints,
            espnRank: team.espnRank,
            playoffSeed: team.playoffSeed,
            laLigaBucks: team.laLigaBucks || 0,
            espnComponent: team.espnComponent || 0,
            cumulativeComponent: team.cumulativeComponent || 0,
            weeklyAverageComponent: team.weeklyAverageComponent || 0,
            earnings: team.earnings || 0,
            weeklyHighScores: team.weeklyHighScores || 0
          };
          
          // DEBUG: Log the processed values
          console.log(`✅ PROCESSED Team ${team.name}:`, {
            processedLaLigaBucks: processedTeam.laLigaBucks,
            processedEspnComponent: processedTeam.espnComponent,
            processedCumulativeComponent: processedTeam.cumulativeComponent
          });
          
          return processedTeam;
        });
        
        console.log(`Setting ${processedTeams.length} processed teams directly`);
        this.state.setTeams(processedTeams);
        
        // Load matchups data for this year - try multiple weeks to find data
        console.log(`Loading matchups for ${year}...`);
        const matchupsData = await this.dataService.loadMatchups(1, year);
        console.log(`Raw matchups response:`, matchupsData);
        console.log(`Loaded ${Array.isArray(matchupsData) ? matchupsData.length : 0} matchups for ${year}`);
        
        this.state.setMatchups(matchupsData || []);
        this.state.setCurrentWeek(1); // Start with week 1 instead of 17
        
        console.log('✅ Historical data loaded successfully');
        console.groupEnd();
      } else {
        console.warn(`❌ No valid API data for year ${year} - received:`, apiData);
        console.groupEnd();
        this.showSeasonNotStarted();
      }
      
    } catch (error) {
      console.error(`❌ ERROR in loadHistoricalData for ${year}:`, error.message, error.stack);
      console.groupEnd();
      this.logger.error(`Failed to load historical data for ${year}:`, error);
      this.showDataError(`Failed to load ${year} season data`);
      this.showSeasonNotStarted();
    }
  }

  /**
   * Setup application event listeners
   */
  setupEventListeners() {
    // Year selector change
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.handleYearChange(parseInt(e.target.value));
      });
    }

    // Global error handling
    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('Unhandled promise rejection:', event.reason);
      this.showError('An unexpected error occurred. Please refresh the page.');
    });

    // Window resize handler
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Setup application routing
   */
  setupRouting() {
    this.router.init();
    
    // Handle section navigation
    this.components.navigation.onSectionChange((sectionId) => {
      this.showSection(sectionId);
    });
  }

  /**
   * Handle year selection change
   */
  async handleYearChange(year) {
    this.logger.info(`Switching to year: ${year}`);
    
    this.state.setCurrentYear(year);
    this.updateSeasonIndicator(year);
    
    // Update URL state
    this.updateURLState(year);
    
    // Show loading state
    this.showLoadingState();
    
    // Load data for selected year
    if (year === 2025) {
      await this.loadCurrentSeasonData();
    } else {
      await this.loadHistoricalData(year);
    }
    
    // Refresh all components
    this.refreshAllComponents();
    
    this.hideLoadingState();
  }

  /**
   * Initialize URL state management
   */
  initializeURLState() {
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.year) {
        this.logger.info(`Browser navigation detected, switching to year: ${event.state.year}`);
        this.handleBrowserNavigation(event.state.year);
      }
    });
    
    // Set initial state if year is in URL
    const urlYear = this.getYearFromURL();
    if (urlYear) {
      history.replaceState({ year: urlYear }, '', `?year=${urlYear}`);
    }
  }

  /**
   * Get year from URL parameters
   */
  getYearFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const yearParam = urlParams.get('year');
    
    if (yearParam) {
      const year = parseInt(yearParam);
      // Validate year is within reasonable range
      if (year >= 2013 && year <= 2030) {
        this.logger.info(`Year ${year} found in URL`);
        return year;
      }
    }
    
    return null;
  }

  /**
   * Update URL state when year changes
   */
  updateURLState(year) {
    const currentURL = new URL(window.location);
    currentURL.searchParams.set('year', year);
    
    const newURL = currentURL.toString();
    const stateObj = { year: year };
    
    // Add to browser history
    history.pushState(stateObj, '', newURL);
    
    this.logger.info(`URL updated to: ${newURL}`);
  }

  /**
   * Handle browser navigation (back/forward buttons)
   */
  async handleBrowserNavigation(year) {
    // Update state without adding to history
    this.state.setCurrentYear(year);
    this.updateSeasonIndicator(year);
    
    // Update year selector UI
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      yearSelect.value = year;
    }
    
    // Load data for the year
    this.showLoadingState();
    
    if (year === 2025) {
      await this.loadCurrentSeasonData();
    } else {
      await this.loadHistoricalData(year);
    }
    
    this.refreshAllComponents();
    this.hideLoadingState();
  }

  /**
   * Show specific section
   */
  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // Update navigation
    this.components.navigation.setActiveSection(sectionId);
    
    // Render section content
    this.renderSection(sectionId);
  }

  /**
   * Render specific section content
   */
  renderSection(sectionId) {
    switch (sectionId) {
      case 'dashboard':
        this.components.leaderboard.render();
        break;
      case 'matchups':
        this.components.matchups.render();
        break;
      case 'teams':
        this.components.teams.render();
        break;
      case 'playoff-bracket':
        this.components.playoffBracket.render();
        break;
      case 'money':
        this.components.moneyBoard.render();
        break;
      case 'commentary':
        break;
      case 'rules':
        this.components.rules.render();
        break;
    }
  }

  /**
   * Refresh all components with current data
   */
  refreshAllComponents() {
    Object.values(this.components).forEach(component => {
      if (component.refresh) {
        component.refresh();
      }
    });
  }

  /**
   * Update season status indicator
   */
  updateSeasonStatus(status) {
    const indicator = document.getElementById('current-indicator');
    if (indicator) {
      indicator.textContent = status;
    }
    
    const liveIndicator = document.getElementById('live-indicator');
    if (liveIndicator) {
      const span = liveIndicator.querySelector('span:last-child');
      if (span) {
        span.textContent = status;
      }
    }
  }

  /**
   * Update season indicator
   */
  updateSeasonIndicator(year) {
    const subtitle = document.querySelector('.logo-subtitle');
    if (subtitle) {
      subtitle.textContent = `FANTASY FOOTBALL '${year.toString().slice(-2)}`;
    }
    
    if (year === 2025) {
      this.updateSeasonStatus('CURRENT SEASON');
    } else {
      this.updateSeasonStatus('SEASON TOTALS');
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Trigger resize handling in components that need it
    if (this.components.moneyBoard.handleResize) {
      this.components.moneyBoard.handleResize();
    }
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    // Implementation for loading indicator
    const loader = document.querySelector('.loading-indicator');
    if (loader) {
      loader.style.display = 'block';
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const loader = document.querySelector('.loading-indicator');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Show data error
   */
  showDataError(message) {
    this.logger.error('Data error:', message);
    // Implementation for error display
  }

  /**
   * Show fatal error
   */
  showFatalError(message) {
    this.logger.error('Fatal error:', message);
    // Implementation for fatal error display
  }

  /**
   * Show general error
   */
  showError(message) {
    this.logger.error('General error:', message);
    // Implementation for error display
  }
}

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  const app = new LaLigaApp();
  
  // Store app instance globally for debugging
  window.laLigaApp = app;
  
  // Initialize the application
  await app.init();
});

// Export for testing and debugging
export { LaLigaApp };