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

    // Sort teams by playoff seed (1-6 for champions bracket)
    const sortedTeams = [...teams].sort((a, b) => (a.playoffSeed || 13) - (b.playoffSeed || 13));
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

    // Sort teams by playoff seed (get bottom 6 teams)
    const sortedTeams = [...teams].sort((a, b) => (a.playoffSeed || 13) - (b.playoffSeed || 13));
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

    return `
      <div class="tournament-matchup semifinal">
        <div class="matchup-teams">
          <div class="team-slot winner">
            <span class="seed">#1</span>
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
            <span class="seed">#2</span>
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
   * Generate Sacko Wild Card round (seeds 10v11, 9v12 get auto-advance)
   */
  generateSackoWildCard(teams) {
    if (teams.length < 6) {
      return '<div class="no-bracket-data">Not enough teams for sacko bracket</div>';
    }

    // Teams ranked 7-12, so index 3 = seed 10, index 4 = seed 11
    const matchup = { team1: teams[3], team2: teams[4] }; // 10 vs 11

    return `
      ${this.createTournamentMatchup(matchup.team1, matchup.team2, 'sacko')}
      <div class="tournament-matchup bye-advance">
        <div class="auto-advance-header">AUTO-ADVANCE</div>
        <div class="matchup-teams">
          <div class="team-slot advance">
            <span class="seed">#9</span>
            <span class="team-name">${teams[2]?.name || 'TBD'}</span>
            <span class="bye-tag">AUTO</span>
          </div>
          <div class="team-slot advance">
            <span class="seed">#12</span>
            <span class="team-name">${teams[5]?.name || 'TBD'}</span>
            <span class="bye-tag">AUTO</span>
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

    return `
      <div class="tournament-matchup semifinal">
        <div class="matchup-teams">
          <div class="team-slot">
            <span class="seed">#7</span>
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
            <span class="seed">#8</span>
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
    const team1Seed = team1?.playoffSeed || '?';
    const team2Seed = team2?.playoffSeed || '?';

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
   * Refresh bracket display
   */
  refresh() {
    this.render();
  }
}