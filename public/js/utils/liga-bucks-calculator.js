/**
 * Liga Bucks Calculator - Frontend Utility
 * Client-side Liga Bucks calculation and validation
 * Ensures consistency with backend calculations
 */

import { Logger } from './logger.js';

export class LigaBucksCalculator {
  constructor() {
    this.logger = new Logger('LigaBucksCalculator');
    this.maxBucks = 24; // 12 ESPN + 12 Points
    this.minBucks = 2;  // 1 ESPN + 1 Points
    this.teamCount = 12;
  }

  /**
   * Calculate Liga Bucks for a set of teams
   * @param {Array} teams - Team data with wins, losses, total points
   * @returns {Array} Teams with Liga Bucks calculations
   */
  calculateLigaBucks(teams) {
    if (!Array.isArray(teams) || teams.length === 0) {
      this.logger.warn('No teams provided for Liga Bucks calculation');
      return [];
    }

    this.logger.info(`Calculating Liga Bucks for ${teams.length} teams`);

    try {
      // Step 1: Calculate ESPN component (based on win-loss record)
      const espnRankings = this.calculateESPNRankings(teams);
      
      // Step 2: Calculate Points component (based on total points)
      const pointsRankings = this.calculatePointsRankings(teams);
      
      // Step 3: Combine components and create final Liga Bucks data
      const teamsWithBucks = teams.map((team, index) => {
        const espnRank = espnRankings.find(rank => rank.teamId === team.id);
        const pointsRank = pointsRankings.find(rank => rank.teamId === team.id);
        
        const espnComponent = espnRank ? (this.teamCount + 1 - espnRank.rank) : 0;
        const pointsComponent = pointsRank ? (this.teamCount + 1 - pointsRank.rank) : 0;
        const totalBucks = espnComponent + pointsComponent;
        
        return {
          ...team,
          laLigaBucks: {
            total: totalBucks,
            espnComponent: espnComponent,
            pointsComponent: pointsComponent,
            breakdown: {
              espnRank: espnRank?.rank || this.teamCount,
              pointsRank: pointsRank?.rank || this.teamCount,
              maxPossible: this.maxBucks
            }
          },
          // Legacy format for backward compatibility
          espnComponent: espnComponent,
          cumulativeComponent: pointsComponent,
          totalLigaBucks: totalBucks
        };
      });

      // Sort by total Liga Bucks (descending)
      teamsWithBucks.sort((a, b) => b.laLigaBucks.total - a.laLigaBucks.total);

      this.logger.info(`Liga Bucks calculation completed successfully`);
      return teamsWithBucks;

    } catch (error) {
      this.logger.error('Liga Bucks calculation failed:', error);
      throw new Error(`Liga Bucks calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate ESPN rankings based on win-loss record
   * @param {Array} teams - Team data
   * @returns {Array} ESPN rankings
   */
  calculateESPNRankings(teams) {
    const teamStats = teams.map(team => ({
      teamId: team.id,
      wins: team.record?.wins || 0,
      losses: team.record?.losses || 0,
      ties: team.record?.ties || 0,
      totalPoints: team.totalPoints || 0,
      winPercentage: this.calculateWinPercentage(team.record)
    }));

    // Sort by wins (descending), then by total points (descending) for tiebreaker
    teamStats.sort((a, b) => {
      if (a.wins !== b.wins) {
        return b.wins - a.wins; // More wins = better rank
      }
      // Tiebreaker: total points
      return b.totalPoints - a.totalPoints;
    });

    // Assign ranks
    return teamStats.map((team, index) => ({
      teamId: team.teamId,
      rank: index + 1,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      winPercentage: team.winPercentage
    }));
  }

  /**
   * Calculate points rankings based on total points for
   * @param {Array} teams - Team data
   * @returns {Array} Points rankings
   */
  calculatePointsRankings(teams) {
    const teamStats = teams.map(team => ({
      teamId: team.id,
      totalPoints: team.totalPoints || 0
    }));

    // Sort by total points (descending)
    teamStats.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign ranks
    return teamStats.map((team, index) => ({
      teamId: team.teamId,
      rank: index + 1,
      totalPoints: team.totalPoints
    }));
  }

  /**
   * Calculate win percentage from record
   * @param {Object} record - Win-loss record
   * @returns {number} Win percentage
   */
  calculateWinPercentage(record) {
    if (!record) return 0;
    
    const wins = record.wins || 0;
    const losses = record.losses || 0;
    const ties = record.ties || 0;
    const totalGames = wins + losses + ties;
    
    if (totalGames === 0) return 0;
    
    // Ties count as 0.5 wins
    const effectiveWins = wins + (ties * 0.5);
    return (effectiveWins / totalGames) * 100;
  }

  /**
   * Validate Liga Bucks calculation
   * @param {Array} teams - Teams with Liga Bucks
   * @returns {Object} Validation results
   */
  validateCalculation(teams) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      summary: {}
    };

    if (!Array.isArray(teams) || teams.length === 0) {
      validation.valid = false;
      validation.errors.push('No teams provided for validation');
      return validation;
    }

    // Check team count
    if (teams.length !== this.teamCount) {
      validation.warnings.push(`Expected ${this.teamCount} teams, got ${teams.length}`);
    }

    // Validate each team
    teams.forEach((team, index) => {
      const bucks = team.laLigaBucks;
      
      if (!bucks) {
        validation.errors.push(`Team ${team.name || index} missing Liga Bucks data`);
        return;
      }

      // Check component ranges
      if (bucks.espnComponent < 1 || bucks.espnComponent > 12) {
        validation.errors.push(`Team ${team.name} ESPN component out of range: ${bucks.espnComponent}`);
      }

      if (bucks.pointsComponent < 1 || bucks.pointsComponent > 12) {
        validation.errors.push(`Team ${team.name} Points component out of range: ${bucks.pointsComponent}`);
      }

      // Check total calculation
      const expectedTotal = bucks.espnComponent + bucks.pointsComponent;
      if (bucks.total !== expectedTotal) {
        validation.errors.push(`Team ${team.name} total calculation error: ${bucks.total} vs ${expectedTotal}`);
      }
    });

    // Check for duplicate rankings
    const espnComponents = teams.map(t => t.laLigaBucks.espnComponent);
    const pointsComponents = teams.map(t => t.laLigaBucks.pointsComponent);
    
    if (new Set(espnComponents).size !== espnComponents.length) {
      validation.warnings.push('Duplicate ESPN component values detected (ties in record)');
    }

    if (new Set(pointsComponents).size !== pointsComponents.length) {
      validation.warnings.push('Duplicate Points component values detected (ties in points)');
    }

    validation.valid = validation.errors.length === 0;
    
    // Calculate summary stats
    validation.summary = {
      teamCount: teams.length,
      averageBucks: teams.reduce((sum, team) => sum + team.laLigaBucks.total, 0) / teams.length,
      maxBucks: Math.max(...teams.map(t => t.laLigaBucks.total)),
      minBucks: Math.min(...teams.map(t => t.laLigaBucks.total)),
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    };

    return validation;
  }

  /**
   * Generate Liga Bucks power bar data for UI
   * @param {Object} team - Team with Liga Bucks data
   * @returns {Object} Power bar configuration
   */
  generatePowerBarData(team) {
    if (!team.laLigaBucks) {
      return {
        total: 0,
        percentage: 0,
        espnPercentage: 0,
        pointsPercentage: 0,
        valid: false
      };
    }

    const bucks = team.laLigaBucks;
    const totalPercentage = (bucks.total / this.maxBucks) * 100;
    const espnPercentage = (bucks.espnComponent / 12) * 50; // Max 50% for ESPN
    const pointsPercentage = (bucks.pointsComponent / 12) * 50; // Max 50% for Points

    return {
      total: bucks.total,
      percentage: totalPercentage,
      espnPercentage: espnPercentage,
      pointsPercentage: pointsPercentage,
      espnComponent: bucks.espnComponent,
      pointsComponent: bucks.pointsComponent,
      maxPossible: this.maxBucks,
      valid: true
    };
  }

  /**
   * Compare two Liga Bucks calculations
   * @param {Array} teams1 - First calculation
   * @param {Array} teams2 - Second calculation
   * @returns {Object} Comparison results
   */
  compareCalculations(teams1, teams2) {
    const comparison = {
      identical: true,
      differences: [],
      summary: {
        teams1Count: teams1.length,
        teams2Count: teams2.length,
        matchingTeams: 0,
        differingTeams: 0
      }
    };

    // Create maps for easy lookup
    const teams1Map = new Map(teams1.map(t => [t.id, t]));
    const teams2Map = new Map(teams2.map(t => [t.id, t]));

    // Compare each team
    teams1Map.forEach((team1, teamId) => {
      const team2 = teams2Map.get(teamId);
      
      if (!team2) {
        comparison.identical = false;
        comparison.differences.push({
          teamId,
          teamName: team1.name,
          issue: 'Team missing from second calculation'
        });
        return;
      }

      const bucks1 = team1.laLigaBucks;
      const bucks2 = team2.laLigaBucks;

      if (!bucks1 || !bucks2) {
        comparison.identical = false;
        comparison.differences.push({
          teamId,
          teamName: team1.name,
          issue: 'Liga Bucks data missing'
        });
        return;
      }

      if (bucks1.total !== bucks2.total ||
          bucks1.espnComponent !== bucks2.espnComponent ||
          bucks1.pointsComponent !== bucks2.pointsComponent) {
        comparison.identical = false;
        comparison.differences.push({
          teamId,
          teamName: team1.name,
          issue: 'Liga Bucks values differ',
          calculation1: bucks1,
          calculation2: bucks2
        });
        comparison.summary.differingTeams++;
      } else {
        comparison.summary.matchingTeams++;
      }
    });

    return comparison;
  }
}

// Export singleton instance and class
const ligaBucksCalculator = new LigaBucksCalculator();

export {
  ligaBucksCalculator,
  LigaBucksCalculator
};

// Convenience functions
export const calculateLigaBucks = (teams) => ligaBucksCalculator.calculateLigaBucks(teams);
export const validateLigaBucks = (teams) => ligaBucksCalculator.validateCalculation(teams);
export const generatePowerBarData = (team) => ligaBucksCalculator.generatePowerBarData(team);