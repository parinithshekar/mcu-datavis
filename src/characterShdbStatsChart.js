function createCharacterShdbStatsChart(selectedCharacterIds) {
  if (!selectedCharacterIds.length) {
    const emptyMessage = d3
      .create('h3')
      .style('white-space', 'pre-line')
      .text('Select heores to visualize stats');
    document.getElementById('radar-chart').innerHTML = '';
    document.getElementById('radar-chart').appendChild(emptyMessage.node());
    return;
  }

  let characterStatsData = [];

  for (characterId in characterStats) {
    if (selectedCharacterIds.includes(Number(characterId))) {
      statsEntry = [];
      characterAbilities = characterStats[characterId];
      for (ability in characterAbilities) {
        // Tier is a confusing attribute which is not in the same scale
        if (ability === 'Tier') {
          continue;
        }
        abilityEntry = {
          axis: ability,
          // scaling abilities is useful when including Tier in the chart
          // value: scaleAbilityStat(ability, characterAbilities[ability]),
          value: characterAbilities[ability],
          realValue: characterAbilities[ability],
          characterId: characterId,
        };
        statsEntry.push(abilityEntry);
      }
      characterStatsData.push(statsEntry);
    }
  }

  // Plot the smallest polygon at the top
  characterStatsData.sort((a, b) => {
    aTotal = a.reduce((total, ability) => {
      return total + ability.value;
    }, 0);
    bTotal = b.reduce((total, ability) => {
      return total + ability.value;
    }, 0);
    // descending sort
    return bTotal - aTotal;
  });

  const characterColors = characterStatsData.map(
    (characterStats) => CHARACTER[characterStats[0].characterId].color
  );
  const characterNames = characterStatsData.map(
    (characterStats) => CHARACTER[characterStats[0].characterId].name
  );

  var margin = { top: 70, right: 70, bottom: 70, left: 70 },
    width = Math.min(500, window.innerWidth - 10) - margin.left - margin.right,
    height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

  var color = d3.scaleOrdinal().range(characterColors);

  var radarChartOptions = {
    w: width,
    h: height,
    margin: margin,
    maxValue: 100,
    levels: 5,
    roundStrokes: false,
    color: color,
    blobNames: characterNames,
  };
  //Call function to draw the Radar chart
  document.getElementById('radar-chart').innerHTML = '';
  RadarChart('#radar-chart', characterStatsData, radarChartOptions);
}

// Dummy data for reference
var data = [
  [
    //iPhone
    { axis: 'Battery Life', value: 0.22 },
    { axis: 'Brand', value: 0.28 },
    { axis: 'Contract Cost', value: 0.29 },
    { axis: 'Design And Quality', value: 0.17 },
    { axis: 'Have Internet Connectivity', value: 0.22 },
    { axis: 'Large Screen', value: 0.02 },
    { axis: 'Price Of Device', value: 0.21 },
    { axis: 'To Be A Smartphone', value: 0.5 },
  ],
  [
    //Samsung
    { axis: 'Battery Life', value: 0.27 },
    { axis: 'Brand', value: 0.16 },
    { axis: 'Contract Cost', value: 0.35 },
    { axis: 'Design And Quality', value: 0.13 },
    { axis: 'Have Internet Connectivity', value: 0.2 },
    { axis: 'Large Screen', value: 0.13 },
    { axis: 'Price Of Device', value: 0.35 },
    { axis: 'To Be A Smartphone', value: 0.38 },
  ],
  [
    //Nokia Smartphone
    { axis: 'Battery Life', value: 0.26 },
    { axis: 'Brand', value: 0.1 },
    { axis: 'Contract Cost', value: 0.3 },
    { axis: 'Design And Quality', value: 0.14 },
    { axis: 'Have Internet Connectivity', value: 0.22 },
    { axis: 'Large Screen', value: 0.04 },
    { axis: 'Price Of Device', value: 0.41 },
    { axis: 'To Be A Smartphone', value: 0.3 },
  ],
];
