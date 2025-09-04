// Team model for MongoDB collections
class Team {
  constructor(data) {
    this.espnId = data.espnId || data.id;
    this.name = data.name;
    this.abbrev = data.abbrev;
    this.owner = data.primaryOwner;
    this.season = data.season || 2024;
    this.playoffSeed = data.playoffSeed;
    this.points = data.points;
    this.record = data.record;
    this.logo = data.logo;
    this.laLigaBucks = data.laLigaBucks || {};
    this.lastUpdated = new Date();
  }

  // Convert to MongoDB document format
  toDocument() {
    return {
      espnId: this.espnId,
      name: this.name,
      abbrev: this.abbrev,
      owner: this.owner,
      season: this.season,
      playoffSeed: this.playoffSeed,
      totalPoints: this.points,
      record: this.record,
      logo: this.logo,
      laLigaBucks: this.laLigaBucks,
      lastUpdated: this.lastUpdated
    };
  }

  // Create collection indexes
  static getIndexes() {
    return [
      { espnId: 1, season: 1 }, // Unique team per season
      { season: 1, playoffSeed: 1 }, // For rankings
      { season: 1, 'laLigaBucks.total': -1 } // For La Liga Bucks leaderboard
    ];
  }
}

module.exports = Team;