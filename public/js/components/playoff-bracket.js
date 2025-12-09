/**
 * Playoff Bracket Component
 * Handles both Champions and Sacko playoff brackets
 */

import { Logger } from '../utils/logger.js';

export class PlayoffBracket {
  constructor(state, dataService) {
    this.state = state;
    this.dataService = dataService;
    this.logger = new Logger('PlayoffBracket');
  }

  /**
   * Initialize playoff bracket
   */
  init() {
    this.render();
    this.logger.component('PlayoffBracket', 'initialized');
  }

  /**
   * Render both brackets
   */
  render() {
    this.renderChampionsBracket();
    this.renderSackoBracket();
  }

  /**
   * Render Champions Bracket
   */
  renderChampionsBracket() {
    const container = document.getElementById('champions-bracket');
    if (!container) return;

    const teams = this.state.getTeams();
    if (!teams || teams.length === 0) {
      container.innerHTML = '<div class="no-bracket-data">No team data available for bracket</div>';
      return;
    }

    // Sort teams by La Liga Bucks (leaderboard ranking: 50% ESPN + 50% Points For)
    // This is the correct playoff seeding - NOT ESPN rank alone
    const sortedTeams = this.sortByLeaderboardRank(teams);
    const championTeams = sortedTeams.slice(0, 6); // Top 6 teams

    const bracketHTML = `
      <div class="tournament-bracket champions-tournament">
        <div class="tournament-round" data-round="1">
          <div class="round-header">WILD CARD</div>
          <div class="round-matchups">
            ${this.generateChampionsWildCard(championTeams)}
          </div>
        </div>
        <div class="bracket-connector">
          <div class="connector-lines"></div>
        </div>
        <div class="tournament-round" data-round="2">
          <div class="round-header">SEMIFINALS</div>
          <div class="round-matchups">
            ${this.generateChampionsSemifinals(championTeams)}
          </div>
        </div>
        <div class="bracket-connector">
          <div class="connector-lines"></div>
        </div>
        <div class="tournament-round" data-round="3">
          <div class="round-header">CHAMPIONSHIP</div>
          <div class="round-matchups">
            ${this.generateChampionsFinal()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = bracketHTML;
  }

  /**
   * Render Sacko Bracket
   */
  renderSackoBracket() {
    const container = document.getElementById('sacko-bracket');
    if (!container) return;

    const teams = this.state.getTeams();
    if (!teams || teams.length === 0) {
      container.innerHTML = '<div class="no-bracket-data">No team data available for bracket</div>';
      return;
    }

    // Sort teams by La Liga Bucks (leaderboard ranking: 50% ESPN + 50% Points For)
    // This is the correct playoff seeding - NOT ESPN rank alone
    const sortedTeams = this.sortByLeaderboardRank(teams);
    const sackoTeams = sortedTeams.slice(6, 12); // Teams ranked 7-12

    const bracketHTML = `
      <div class="tournament-bracket sacko-tournament">
        <div class="tournament-round" data-round="1">
          <div class="round-header">SACKO WILD CARD</div>
          <div class="round-matchups">
            ${this.generateSackoWildCard(sackoTeams)}
          </div>
        </div>
        <div class="bracket-connector">
          <div class="connector-lines"></div>
        </div>
        <div class="tournament-round" data-round="2">
          <div class="round-header">SACKO SEMIFINAL</div>
          <div class="round-matchups">
            ${this.generateSackoSemifinal(sackoTeams)}
          </div>
        </div>
        <div class="bracket-connector">
          <div class="connector-lines"></div>
        </div>
        <div class="tournament-round" data-round="3">
          <div class="round-header">💩 SACKO BOWL 💩</div>
          <div class="round-matchups">
            ${this.generateSackoFinal()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = bracketHTML;
  }

  /**
   * Generate Champions Wild Card round (seeds 3v6, 4v5)
   */
  generateChampionsWildCard(teams) {
    if (teams.length < 6) {
      return '<div class="no-bracket-data">Not enough teams for wild card round</div>';
    }

    const matchups = [
      { team1: teams[2], team2: teams[5] }, // 3 vs 6
      { team1: teams[3], team2: teams[4] }  // 4 vs 5
    ];

    return matchups.map(matchup => 
      this.createTournamentMatchup(matchup.team1, matchup.team2, 'champions')
    ).join('');
  }

  /**
   * Generate Champions Semifinals (seeds 1v2 get bye to face WC winners)
   */
  generateChampionsSemifinals(teams) {
    if (teams.length < 2) {
      return '<div class="no-bracket-data">Semifinals TBD</div>';
    }

    // Use leaderboardRank for display
    const seed1 = teams[0]?.leaderboardRank || 1;
    const seed2 = teams[1]?.leaderboardRank || 2;

    return `
      <div class="tournament-matchup semifinal">
        <div class="matchup-teams">
          <div class="team-slot winner">
            <span class="seed">#${seed1}</span>
            <span class="team-name">${teams[0]?.name || 'TBD'}</span>
            <span class="bye-tag">BYE</span>
          </div>
          <div class="vs-divider">VS</div>
          <div class="team-slot tbd">
            <span class="seed">WC</span>
            <span class="team-name">WC Winner</span>
          </div>
        </div>
      </div>
      <div class="tournament-matchup semifinal">
        <div class="matchup-teams">
          <div class="team-slot winner">
            <span class="seed">#${seed2}</span>
            <span class="team-name">${teams[1]?.name || 'TBD'}</span>
            <span class="bye-tag">BYE</span>
          </div>
          <div class="vs-divider">VS</div>
          <div class="team-slot tbd">
            <span class="seed">WC</span>
            <span class="team-name">WC Winner</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate Champions Final
   */
  generateChampionsFinal() {
    return `
      <div class="tournament-matchup championship">
        <div class="championship-header">🏆 CHAMPIONSHIP 🏆</div>
        <div class="matchup-teams">
          <div class="team-slot tbd">
            <span class="team-name">SF Winner</span>
          </div>
          <div class="vs-divider">VS</div>
          <div class="team-slot tbd">
            <span class="team-name">SF Winner</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate Sacko Wild Card round (7v10, 8v9, seeds 11 and 12 get bye)
   */
  generateSackoWildCard(teams) {
    if (teams.length < 6) {
      return '<div class="no-bracket-data">Not enough teams for sacko bracket</div>';
    }

    // Teams ranked 7-12 (sackoTeams slice), so:
    // index 0 = seed 7, index 1 = seed 8, index 2 = seed 9,
    // index 3 = seed 10, index 4 = seed 11, index 5 = seed 12
    const matchup1 = { team1: teams[0], team2: teams[3] }; // 7 vs 10
    const matchup2 = { team1: teams[1], team2: teams[2] }; // 8 vs 9

    // Use leaderboardRank for display - seeds 11 and 12 get bye (worst teams auto-advance)
    const seed11 = teams[4]?.leaderboardRank || 11;
    const seed12 = teams[5]?.leaderboardRank || 12;

    return `
      ${this.createTournamentMatchup(matchup1.team1, matchup1.team2, 'sacko')}
      ${this.createTournamentMatchup(matchup2.team1, matchup2.team2, 'sacko')}
      <div class="tournament-matchup bye-advance">
        <div class="auto-advance-header">BYE WEEK</div>
        <div class="matchup-teams">
          <div class="team-slot advance">
            <span class="seed">#${seed11}</span>
            <span class="team-name">${teams[4]?.name || 'TBD'}</span>
            <span class="bye-tag">BYE</span>
          </div>
          <div class="team-slot advance">
            <span class="seed">#${seed12}</span>
            <span class="team-name">${teams[5]?.name || 'TBD'}</span>
            <span class="bye-tag">BYE</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate Sacko Semifinal (seed 8 vs seed 7, WC winner vs auto-advance)
   */
  generateSackoSemifinal(teams) {
    if (teams.length < 2) {
      return '<div class="no-bracket-data">Sacko Semifinal TBD</div>';
    }

    // Use leaderboardRank for display
    const seed7 = teams[0]?.leaderboardRank || 7;
    const seed8 = teams[1]?.leaderboardRank || 8;

    return `
      <div class="tournament-matchup semifinal">
        <div class="matchup-teams">
          <div class="team-slot">
            <span class="seed">#${seed7}</span>
            <span class="team-name">${teams[0]?.name || 'TBD'}</span>
          </div>
          <div class="vs-divider">VS</div>
          <div class="team-slot tbd">
            <span class="seed">WC</span>
            <span class="team-name">WC Winner</span>
          </div>
        </div>
      </div>
      <div class="tournament-matchup semifinal">
        <div class="matchup-teams">
          <div class="team-slot">
            <span class="seed">#${seed8}</span>
            <span class="team-name">${teams[1]?.name || 'TBD'}</span>
          </div>
          <div class="vs-divider">VS</div>
          <div class="team-slot tbd">
            <span class="seed">AUTO</span>
            <span class="team-name">Auto Advance</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate Sacko Final
   */
  generateSackoFinal() {
    return `
      <div class="tournament-matchup sacko-bowl">
        <div class="sacko-header">💩 SACKO BOWL 💩</div>
        <div class="matchup-teams">
          <div class="team-slot tbd">
            <span class="team-name">SF Loser</span>
          </div>
          <div class="vs-divider">VS</div>
          <div class="team-slot tbd">
            <span class="team-name">SF Loser</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create a tournament matchup element
   */
  createTournamentMatchup(team1, team2, bracketType = 'champions') {
    const team1Name = team1?.name || 'TBD';
    const team2Name = team2?.name || 'TBD';
    // Use leaderboardRank (La Liga Bucks rank) NOT playoffSeed (ESPN rank)
    const team1Seed = team1?.leaderboardRank || '?';
    const team2Seed = team2?.leaderboardRank || '?';

    return `
      <div class="tournament-matchup ${bracketType}">
        <div class="matchup-teams">
          <div class="team-slot">
            <span class="seed">#${team1Seed}</span>
            <span class="team-name">${team1Name}</span>
          </div>
          <div class="vs-divider">VS</div>
          <div class="team-slot">
            <span class="seed">#${team2Seed}</span>
            <span class="team-name">${team2Name}</span>
          </div>
        </div>
        <div class="matchup-result">TBD</div>
      </div>
    `;
  }

  /**
   * Create a bracket matchup element (legacy support)
   */
  createBracketMatchup(team1, team2, isSacko = false) {
    return this.createTournamentMatchup(team1, team2, isSacko ? 'sacko' : 'champions');
  }

  /**
   * Sort teams by leaderboard rank (La Liga Bucks)
   * This is the correct ranking: 50% ESPN Rank + 50% Points For
   * Tiebreaker: Total Points For
   */
  sortByLeaderboardRank(teams) {
    return [...teams].sort((a, b) => {
      // Get La Liga Bucks value (handle both object and number formats)
      const getBucks = (team) => {
        if (typeof team.laLigaBucks === 'object' && team.laLigaBucks !== null) {
          return team.laLigaBucks.total || 0;
        }
        return team.laLigaBucks || 0;
      };

      const bucksA = getBucks(a);
      const bucksB = getBucks(b);

      // Primary sort: La Liga Bucks (higher is better)
      if (bucksB !== bucksA) {
        return bucksB - bucksA;
      }

      // Tiebreaker: Total Points For (higher is better)
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    }).map((team, index) => ({
      ...team,
      leaderboardRank: index + 1  // Assign rank based on sorted position
    }));
  }

  /**
   * Refresh bracket display
   */
  refresh() {
    this.render();
  }
}