// AI Prediction Service
// Rule-based + weighted scoring engine for agricultural risk prediction

const predictYield = (farm, satelliteData, weatherData) => {
  const recentNDVI = satelliteData.slice(-7);
  const recentWeather = weatherData.slice(-7);

  const avgNDVI = recentNDVI.reduce((sum, d) => sum + d.ndvi, 0) / (recentNDVI.length || 1);
  const avgSoilMoisture = recentNDVI.reduce((sum, d) => sum + (d.soilMoisture || 50), 0) / (recentNDVI.length || 1);
  const avgRainfall = recentWeather.reduce((sum, d) => sum + (d.rainfall || 0), 0) / (recentWeather.length || 1);
  const avgTemp = recentWeather.reduce((sum, d) => sum + (d.temperature || 25), 0) / (recentWeather.length || 1);

  // Yield factors
  const ndviScore = Math.min(100, avgNDVI * 120);
  const moistureScore = avgSoilMoisture > 30 && avgSoilMoisture < 80 ? 80 : 40;
  const tempScore = avgTemp > 15 && avgTemp < 38 ? 85 : 45;
  const rainScore = avgRainfall > 0 && avgRainfall < 50 ? 80 : avgRainfall > 50 ? 50 : 30;

  const yieldScore = ndviScore * 0.4 + moistureScore * 0.2 + tempScore * 0.2 + rainScore * 0.2;

  // Estimate yield (tonnes per hectare)
  const baseYield = { rice: 4.5, wheat: 3.5, corn: 5.0, cotton: 2.0, sugarcane: 70, soybean: 2.5 };
  const base = baseYield[farm.cropType?.toLowerCase()] || 3.0;
  const predictedYield = base * (yieldScore / 100) * (0.8 + Math.random() * 0.4);

  const riskLevel = yieldScore > 75 ? 'low' : yieldScore > 50 ? 'moderate' : yieldScore > 30 ? 'high' : 'critical';

  return {
    farm: farm._id,
    type: 'yield',
    riskLevel,
    riskScore: parseFloat((100 - yieldScore).toFixed(1)),
    confidence: parseFloat((60 + Math.random() * 30).toFixed(1)),
    predictedYield: parseFloat(predictedYield.toFixed(2)),
    details: `Yield prediction for ${farm.cropType}: ${predictedYield.toFixed(2)} tonnes/ha. Based on average NDVI of ${avgNDVI.toFixed(3)} and recent rainfall of ${avgRainfall.toFixed(1)}mm/day.`,
    factors: [
      { name: 'Vegetation Health (NDVI)', value: parseFloat(ndviScore.toFixed(1)), impact: ndviScore > 60 ? 'positive' : 'negative' },
      { name: 'Soil Moisture', value: parseFloat(moistureScore.toFixed(1)), impact: moistureScore > 60 ? 'positive' : 'negative' },
      { name: 'Temperature', value: parseFloat(tempScore.toFixed(1)), impact: tempScore > 60 ? 'positive' : 'negative' },
      { name: 'Rainfall', value: parseFloat(rainScore.toFixed(1)), impact: rainScore > 60 ? 'positive' : 'negative' }
    ],
    recommendations: generateRecommendations('yield', { avgNDVI, avgSoilMoisture, avgTemp, avgRainfall }),
    dataUsed: { satelliteReadings: recentNDVI.length, weatherReadings: recentWeather.length, historicalYears: farm.historicalYield?.length || 0 }
  };
};

const predictRisk = (farm, satelliteData, weatherData, riskType) => {
  const recentNDVI = satelliteData.slice(-7);
  const recentWeather = weatherData.slice(-7);

  const avgNDVI = recentNDVI.reduce((sum, d) => sum + d.ndvi, 0) / (recentNDVI.length || 1);
  const avgRainfall = recentWeather.reduce((sum, d) => sum + (d.rainfall || 0), 0) / (recentWeather.length || 1);
  const avgTemp = recentWeather.reduce((sum, d) => sum + (d.temperature || 25), 0) / (recentWeather.length || 1);
  const avgHumidity = recentWeather.reduce((sum, d) => sum + (d.humidity || 50), 0) / (recentWeather.length || 1);
  const avgSoilMoisture = recentNDVI.reduce((sum, d) => sum + (d.soilMoisture || 50), 0) / (recentNDVI.length || 1);

  let riskScore = 0;
  let details = '';
  let factors = [];

  switch (riskType) {
    case 'drought':
      const droughtRain = avgRainfall < 2 ? 90 : avgRainfall < 5 ? 60 : avgRainfall < 15 ? 30 : 10;
      const droughtMoisture = avgSoilMoisture < 25 ? 85 : avgSoilMoisture < 40 ? 55 : 20;
      const droughtTemp = avgTemp > 38 ? 80 : avgTemp > 33 ? 50 : 15;
      riskScore = droughtRain * 0.4 + droughtMoisture * 0.35 + droughtTemp * 0.25;
      factors = [
        { name: 'Rainfall Deficit', value: parseFloat(droughtRain.toFixed(1)), impact: droughtRain > 50 ? 'negative' : 'positive' },
        { name: 'Soil Moisture', value: parseFloat(droughtMoisture.toFixed(1)), impact: droughtMoisture > 50 ? 'negative' : 'positive' },
        { name: 'Temperature Stress', value: parseFloat(droughtTemp.toFixed(1)), impact: droughtTemp > 50 ? 'negative' : 'positive' }
      ];
      details = `Drought risk assessment: avg rainfall ${avgRainfall.toFixed(1)}mm, soil moisture ${avgSoilMoisture.toFixed(1)}%, temp ${avgTemp.toFixed(1)}°C`;
      break;

    case 'flood':
      const floodRain = avgRainfall > 80 ? 95 : avgRainfall > 40 ? 70 : avgRainfall > 20 ? 35 : 10;
      const floodMoisture = avgSoilMoisture > 85 ? 90 : avgSoilMoisture > 70 ? 55 : 15;
      riskScore = floodRain * 0.6 + floodMoisture * 0.4;
      factors = [
        { name: 'Excessive Rainfall', value: parseFloat(floodRain.toFixed(1)), impact: floodRain > 50 ? 'negative' : 'positive' },
        { name: 'Soil Saturation', value: parseFloat(floodMoisture.toFixed(1)), impact: floodMoisture > 50 ? 'negative' : 'positive' }
      ];
      details = `Flood risk assessment: avg rainfall ${avgRainfall.toFixed(1)}mm, soil moisture ${avgSoilMoisture.toFixed(1)}%`;
      break;

    case 'disease':
      const diseaseHumidity = avgHumidity > 80 ? 85 : avgHumidity > 65 ? 55 : 20;
      const diseaseTemp = (avgTemp > 22 && avgTemp < 30) ? 70 : 30;
      const diseaseNDVI = avgNDVI < 0.4 ? 75 : avgNDVI < 0.6 ? 45 : 15;
      riskScore = diseaseHumidity * 0.4 + diseaseTemp * 0.3 + diseaseNDVI * 0.3;
      factors = [
        { name: 'High Humidity', value: parseFloat(diseaseHumidity.toFixed(1)), impact: diseaseHumidity > 50 ? 'negative' : 'positive' },
        { name: 'Temperature Range', value: parseFloat(diseaseTemp.toFixed(1)), impact: diseaseTemp > 50 ? 'negative' : 'neutral' },
        { name: 'Vegetation Stress', value: parseFloat(diseaseNDVI.toFixed(1)), impact: diseaseNDVI > 50 ? 'negative' : 'positive' }
      ];
      details = `Disease risk assessment: humidity ${avgHumidity.toFixed(1)}%, temp ${avgTemp.toFixed(1)}°C, NDVI ${avgNDVI.toFixed(3)}`;
      break;

    default:
      riskScore = 50;
      details = 'General risk assessment';
  }

  const riskLevel = riskScore > 75 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 25 ? 'moderate' : 'low';

  return {
    farm: farm._id,
    type: riskType,
    riskLevel,
    riskScore: parseFloat(riskScore.toFixed(1)),
    confidence: parseFloat((55 + Math.random() * 35).toFixed(1)),
    details,
    factors,
    recommendations: generateRecommendations(riskType, { avgNDVI, avgSoilMoisture: avgSoilMoisture, avgTemp, avgRainfall, avgHumidity }),
    dataUsed: { satelliteReadings: recentNDVI.length, weatherReadings: recentWeather.length, historicalYears: farm.historicalYield?.length || 0 }
  };
};

const generateRecommendations = (type, data) => {
  const recommendations = [];

  switch (type) {
    case 'yield':
      if (data.avgNDVI < 0.5) recommendations.push('Consider applying fertilizers to boost vegetation health');
      if (data.avgSoilMoisture < 35) recommendations.push('Increase irrigation frequency to improve soil moisture');
      if (data.avgTemp > 35) recommendations.push('Implement shade nets or mulching to reduce heat stress');
      if (data.avgRainfall < 5) recommendations.push('Monitor drought conditions and prepare supplemental water sources');
      recommendations.push('Schedule crop health inspection within the next week');
      break;

    case 'drought':
      if (data.avgRainfall < 5) recommendations.push('Activate water conservation measures immediately');
      recommendations.push('Switch to drought-resistant crop varieties for next season');
      recommendations.push('Consider drip irrigation to maximize water efficiency');
      recommendations.push('Apply mulching to reduce evaporation');
      break;

    case 'flood':
      if (data.avgRainfall > 40) recommendations.push('Ensure proper drainage channels are clear');
      recommendations.push('Move stored grain to elevated locations');
      recommendations.push('Consider raised bed farming for flood-prone areas');
      recommendations.push('Review crop insurance coverage for flood damage');
      break;

    case 'disease':
      if (data.avgHumidity > 75) recommendations.push('Reduce plant density to improve air circulation');
      recommendations.push('Apply preventative fungicide treatment');
      recommendations.push('Monitor for early signs of leaf blight and rust');
      recommendations.push('Maintain field sanitation by removing infected plant debris');
      break;
  }

  return recommendations;
};

// Calculate an overall farm health score (0-100) from satellite, weather, and prediction data
const calculateHealthScore = (satelliteData, weatherData, predictions = []) => {
  const recentSat = satelliteData.slice(-7);
  const recentWeather = weatherData.slice(-7);

  // --- Vegetation health from NDVI (40% weight) ---
  const avgNDVI = recentSat.length > 0
    ? recentSat.reduce((sum, d) => sum + d.ndvi, 0) / recentSat.length
    : 0.5; // neutral default
  // NDVI ranges from -1 to 1; healthy vegetation is 0.6-0.9
  const ndviScore = Math.min(100, Math.max(0, avgNDVI * 125));

  // --- Soil moisture optimality (20% weight) ---
  const avgMoisture = recentSat.length > 0
    ? recentSat.reduce((sum, d) => sum + (d.soilMoisture || 50), 0) / recentSat.length
    : 50;
  // Ideal moisture is 35-70%, penalize too dry or too wet
  let moistureScore;
  if (avgMoisture >= 35 && avgMoisture <= 70) {
    moistureScore = 85 + Math.random() * 10;
  } else if (avgMoisture >= 20 && avgMoisture <= 85) {
    moistureScore = 55 + Math.random() * 15;
  } else {
    moistureScore = 20 + Math.random() * 15;
  }

  // --- Weather fitness (20% weight) ---
  const avgTemp = recentWeather.length > 0
    ? recentWeather.reduce((sum, d) => sum + (d.temperature || 25), 0) / recentWeather.length
    : 25;
  const avgRainfall = recentWeather.length > 0
    ? recentWeather.reduce((sum, d) => sum + (d.rainfall || 5), 0) / recentWeather.length
    : 5;
  const tempScore = (avgTemp >= 18 && avgTemp <= 35) ? 85 : (avgTemp >= 10 && avgTemp <= 40) ? 55 : 25;
  const rainScore = (avgRainfall >= 2 && avgRainfall <= 30) ? 80 : (avgRainfall >= 0.5 && avgRainfall <= 60) ? 50 : 25;
  const weatherScore = tempScore * 0.5 + rainScore * 0.5;

  // --- Risk penalty (20% weight) — lower risk = higher health ---
  let riskPenalty = 0;
  if (predictions.length > 0) {
    const avgRiskScore = predictions.reduce((sum, p) => sum + (p.riskScore || 0), 0) / predictions.length;
    riskPenalty = avgRiskScore; // 0-100, higher = worse
  }
  const riskHealth = Math.max(0, 100 - riskPenalty);

  // --- Weighted final score ---
  const healthScore = ndviScore * 0.4 + moistureScore * 0.2 + weatherScore * 0.2 + riskHealth * 0.2;

  return Math.round(Math.min(100, Math.max(0, healthScore)));
};

module.exports = { predictYield, predictRisk, calculateHealthScore };
