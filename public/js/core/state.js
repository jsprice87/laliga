/**
 * Application State Management
 * Centralized state store with reactive updates
 */

export class AppState {
  constructor() {
    this.data = {};
    this.listeners = new Map();
    this.initialize();
  }

  /**
   * Initialize default state
   */
  initialize(initialData = {}) {
    this.data = {
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
      championsHistory: [],
      sackoHistory: [],
      commentary: [],
      currentYear: 2025,
      currentSection: 'dashboard',
      isLoading: false,
      error: null,
      ...initialData
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify listeners of state changes
   */
  notify(key, value) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }

  /**
   * Get current year
   */
  getCurrentYear() {
    return this.data.currentYear;
  }

  /**
   * Get current NFL week - for live 2025 season
   */
  getCurrentWeek() {
    if (this.data.currentYear === 2025) {
      // Calculate current NFL week based on season start
      return this.calculateCurrentNFLWeek();
    }
    return this.data.league.currentWeek;
  }

  /**
   * Calculate current NFL week based on date
   * NFL 2025 season starts September 4th, 2025
   */
  calculateCurrentNFLWeek() {
    const now = new Date();
    const seasonStart = new Date('2025-09-04T00:00:00-04:00'); // September 4th, 2025 EST
    
    if (now < seasonStart) {
      return 1; // Season hasn't started yet
    }
    
    // Calculate weeks since season start
    const timeDiff = now - seasonStart;
    const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    
    // NFL weeks are 1-18 (regular season weeks 1-17 + playoffs)
    const currentWeek = Math.min(weeksSinceStart + 1, 18);
    
    console.log(`📅 NFL Week Calculator: ${daysSinceStart} days since season start = Week ${currentWeek}`);
    
    return currentWeek;
  }

  /**
   * Set current year
   */
  setCurrentYear(year) {
    this.data.currentYear = year;
    this.data.league.season = year;
    this.notify('currentYear', year);
  }

  /**
   * Get league data
   */
  getLeague() {
    return this.data.league;
  }

  /**
   * Update league data
   */
  updateLeague(updates) {
    this.data.league = { ...this.data.league, ...updates };
    this.notify('league', this.data.league);
  }

  /**
   * Get teams
   */
  getTeams() {
    return this.data.teams;
  }

  /**
   * Set teams
   */
  setTeams(teams) {
    this.data.teams = teams;
    this.notify('teams', teams);
  }

  /**
   * Get team by ID
   */
  getTeamById(id) {
    return this.data.teams.find(team => team.id === id);
  }

  /**
   * Get team by name
   */
  getTeamByName(name) {
    return this.data.teams.find(team => team.name === name);
  }

  /**
   * Get matchups
   */
  getMatchups() {
    return this.data.matchups;
  }

  /**
   * Set matchups
   */
  setMatchups(matchups) {
    this.data.matchups = matchups;
    this.notify('matchups', matchups);
  }

  /**
   * Get matchups for specific week
   */
  getMatchupsForWeek(week) {
    return this.data.matchups.filter(matchup => matchup.week === week);
  }

  /**
   * Get league current week (fallback for historical data)
   */
  getLeagueCurrentWeek() {
    return this.data.league.currentWeek;
  }

  /**
   * Set current week
   */
  setCurrentWeek(week) {
    this.data.league.currentWeek = week;
    this.notify('currentWeek', week);
  }

  /**
   * Get champions history
   */
  getChampionsHistory() {
    return this.data.championsHistory;
  }

  /**
   * Set champions history
   */
  setChampionsHistory(history) {
    this.data.championsHistory = history;
    this.notify('championsHistory', history);
  }

  /**
   * Get sacko history
   */
  getSackoHistory() {
    return this.data.sackoHistory;
  }

  /**
   * Set sacko history
   */
  setSackoHistory(history) {
    this.data.sackoHistory = history;
    this.notify('sackoHistory', history);
  }

  /**
   * Get commentary
   */
  getCommentary() {
    return this.data.commentary;
  }

  /**
   * Set commentary
   */
  setCommentary(commentary) {
    this.data.commentary = commentary;
    this.notify('commentary', commentary);
  }

  /**
   * Get current section
   */
  getCurrentSection() {
    return this.data.currentSection;
  }

  /**
   * Set current section
   */
  setCurrentSection(section) {
    this.data.currentSection = section;
    this.notify('currentSection', section);
  }

  /**
   * Get loading state
   */
  getIsLoading() {
    return this.data.isLoading;
  }

  /**
   * Set loading state
   */
  setIsLoading(isLoading) {
    this.data.isLoading = isLoading;
    this.notify('isLoading', isLoading);
  }

  /**
   * Get error state
   */
  getError() {
    return this.data.error;
  }

  /**
   * Set error state
   */
  setError(error) {
    this.data.error = error;
    this.notify('error', error);
  }

  /**
   * Clear error state
   */
  clearError() {
    this.data.error = null;
    this.notify('error', null);
  }

  /**
   * Get all state data (for debugging)
   */
  getState() {
    return { ...this.data };
  }

  /**
   * Calculate team statistics
   */
  calculateTeamStats() {
    const teams = this.getTeams();
    
    return teams.map(team => ({
      ...team,
      totalLaLigaBucks: (team.espnComponent || 0) + (team.cumulativeComponent || 0) + (team.weeklyAverageComponent || 0),
      winPercentage: team.record ? (team.record.wins / (team.record.wins + team.record.losses + team.record.ties)) * 100 : 0,
      pointsPerGame: team.totalPoints ? team.totalPoints / this.getCurrentWeek() : 0
    }));
  }

  /**
   * Sort teams by specified criteria
   */
  sortTeams(criteria = 'bucks') {
    const teams = [...this.getTeams()];
    
    switch (criteria) {
      case 'bucks':
        return teams.sort((a, b) => (b.laLigaBucks || 0) - (a.laLigaBucks || 0));
      case 'espnRank':
        return teams.sort((a, b) => (a.espnRank || 0) - (b.espnRank || 0));
      case 'totalPoints':
        return teams.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      case 'playoffSeed':
        return teams.sort((a, b) => (a.playoffSeed || 0) - (b.playoffSeed || 0));
      case 'earnings':
        return teams.sort((a, b) => (b.earnings || 0) - (a.earnings || 0));
      default:
        return teams;
    }
  }

  /**
   * Get money statistics
   */
  getMoneyStats() {
    const teams = this.getTeams();
    const totalPaid = teams.reduce((sum, team) => sum + (team.earnings || 0), 0);
    const remaining = this.data.league.prizePool - totalPaid;

    return {
      totalPool: this.data.league.prizePool,
      totalPaid,
      remaining,
      weeklyBonus: this.data.league.weeklyBonus
    };
  }
}