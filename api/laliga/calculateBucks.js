function calculateLaLigaBucks(teams) {
  // Sort teams by total points for cumulative component
  const teamsByPoints = [...teams].sort((a, b) => b.totalPointsFor - a.totalPointsFor);
  
  return teams.map(team => {
    // ESPN Rank Component (1-12 points) - higher rank = more points
    const espnComponent = 13 - team.playoffSeed;
    
    // Cumulative Points Component (1-12 points)
    const pointsRank = teamsByPoints.findIndex(t => t.id === team.id) + 1;
    const cumulativeComponent = 13 - pointsRank;
    
    return {
      ...team,
      laLigaBucks: {
        espnComponent,
        cumulativeComponent,
        total: espnComponent + cumulativeComponent
      }
    };
  });
}

module.exports = { calculateLaLigaBucks };