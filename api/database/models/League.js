// League model for MongoDB collections
class League {
  constructor(data) {
    this.season = data.season || 2024;
    this.name = data.name || 'La Liga del Fuego';
    this.currentWeek = data.currentWeek || 1;
    this.totalWeeks = data.totalWeeks || 17;
    this.prizePool = data.prizePool || 0;
    this.weeklyBonus = data.weeklyBonus || 0;
    this.espnLeagueId = data.espnLeagueId;
    this.settings = {
      playoffStart: data.settings?.playoffStart || 15,
      regularSeasonWeeks: data.settings?.regularSeasonWeeks || 14,
      scoringType: data.settings?.scoringType || 'standard'
    };
    this.champions = data.champions || []; // [{year, winner, teamId}]
    this.sackos = data.sackos || []; // [{year, loser, teamId}]
    this.lastUpdated = new Date();
  }

  // Convert to MongoDB document format
  toDocument() {
    return {
      season: this.season,
      name: this.name,
      currentWeek: this.currentWeek,
      totalWeeks: this.totalWeeks,
      prizePool: this.prizePool,
      weeklyBonus: this.weeklyBonus,
      espnLeagueId: this.espnLeagueId,
      settings: this.settings,
      champions: this.champions,
      sackos: this.sackos,
      lastUpdated: this.lastUpdated
    };
  }

  // Add a champion
  addChampion(year, winner, teamId) {
    const existingIndex = this.champions.findIndex(c => c.year === year);
    if (existingIndex >= 0) {
      this.champions[existingIndex] = { year, winner, teamId };
    } else {
      this.champions.push({ year, winner, teamId });
    }
    this.lastUpdated = new Date();
  }

  // Add a sacko (last place)
  addSacko(year, loser, teamId) {
    const existingIndex = this.sackos.findIndex(s => s.year === year);
    if (existingIndex >= 0) {
      this.sackos[existingIndex] = { year, loser, teamId };
    } else {
      this.sackos.push({ year, loser, teamId });
    }
    this.lastUpdated = new Date();
  }

  // Create collection indexes
  static getIndexes() {
    return [
      { season: 1 }, // Unique per season
      { espnLeagueId: 1, season: 1 } // League + season combination
    ];
  }
}

module.exports = League;