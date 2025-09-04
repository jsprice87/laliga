// Matchup model for MongoDB collections
class Matchup {
  constructor(data) {
    this.week = data.week;
    this.season = data.season || 2024;
    this.team1 = {
      id: data.team1.id,
      name: data.team1.name,
      score: data.team1.score || 0,
      projected: data.team1.projected || 0
    };
    this.team2 = {
      id: data.team2.id,
      name: data.team2.name,
      score: data.team2.score || 0,
      projected: data.team2.projected || 0
    };
    this.status = data.status || 'scheduled'; // scheduled, live, final
    this.isPlayoff = data.isPlayoff || false;
    this.lastUpdated = new Date();
  }

  // Convert to MongoDB document format
  toDocument() {
    return {
      week: this.week,
      season: this.season,
      team1: this.team1,
      team2: this.team2,
      status: this.status,
      isPlayoff: this.isPlayoff,
      winner: this.getWinner(),
      lastUpdated: this.lastUpdated
    };
  }

  // Determine winner
  getWinner() {
    if (this.status !== 'final') return null;
    if (this.team1.score > this.team2.score) return this.team1.id;
    if (this.team2.score > this.team1.score) return this.team2.id;
    return null; // tie
  }

  // Create collection indexes
  static getIndexes() {
    return [
      { week: 1, season: 1 }, // Weekly matchups
      { season: 1, isPlayoff: 1 }, // Playoff games
      { 'team1.id': 1, season: 1 }, // Team's games
      { 'team2.id': 1, season: 1 }  // Team's games
    ];
  }
}

module.exports = Matchup;