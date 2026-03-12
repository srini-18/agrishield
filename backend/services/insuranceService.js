// Insurance Service
// Evaluates parametric triggers and auto-creates claims

const evaluateTriggers = async (policy, satelliteData, weatherData) => {
  const triggeredConditions = [];

  for (const trigger of policy.triggers) {
    let currentValue = null;
    let triggered = false;

    switch (trigger.parameter) {
      case 'rainfall':
        const recentRainfall = weatherData.slice(-7);
        const avgRainfall = recentRainfall.reduce((sum, d) => sum + (d.rainfall || 0), 0) / (recentRainfall.length || 1);
        currentValue = avgRainfall;
        
        if (trigger.operator === 'below' && avgRainfall < trigger.threshold) triggered = true;
        if (trigger.operator === 'above' && avgRainfall > trigger.threshold) triggered = true;
        break;

      case 'ndvi':
        const recentNDVI = satelliteData.slice(-3);
        const avgNDVI = recentNDVI.reduce((sum, d) => sum + d.ndvi, 0) / (recentNDVI.length || 1);
        currentValue = avgNDVI;

        if (trigger.operator === 'below' && avgNDVI < trigger.threshold) triggered = true;
        if (trigger.operator === 'drop_by') {
          const olderNDVI = satelliteData.slice(-10, -3);
          const prevAvg = olderNDVI.reduce((sum, d) => sum + d.ndvi, 0) / (olderNDVI.length || 1);
          if (prevAvg - avgNDVI > trigger.threshold) triggered = true;
          currentValue = prevAvg - avgNDVI;
        }
        break;

      case 'temperature':
        const recentTemp = weatherData.slice(-3);
        const avgTemp = recentTemp.reduce((sum, d) => sum + (d.temperature || 25), 0) / (recentTemp.length || 1);
        currentValue = avgTemp;

        if (trigger.operator === 'above' && avgTemp > trigger.threshold) triggered = true;
        if (trigger.operator === 'below' && avgTemp < trigger.threshold) triggered = true;
        break;

      case 'flood_level':
        const maxRainfall = Math.max(...weatherData.slice(-3).map(d => d.rainfall || 0));
        currentValue = maxRainfall;

        if (trigger.operator === 'above' && maxRainfall > trigger.threshold) triggered = true;
        break;
    }

    if (triggered) {
      triggeredConditions.push({
        parameter: trigger.parameter,
        operator: trigger.operator,
        threshold: trigger.threshold,
        currentValue,
        unit: trigger.unit
      });
    }
  }

  return triggeredConditions;
};

const calculatePayout = (policy, triggeredConditions) => {
  // Payout proportional to severity
  const severityRatio = triggeredConditions.length / (policy.triggers.length || 1);
  const basePayout = policy.coverageAmount * Math.min(1, severityRatio * 1.5);
  return parseFloat(basePayout.toFixed(2));
};

module.exports = { evaluateTriggers, calculatePayout };
