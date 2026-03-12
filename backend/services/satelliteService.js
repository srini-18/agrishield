// Satellite Data Simulation Service
// Generates realistic NDVI and crop health data with seasonal patterns

const generateNDVI = (cropType, dayOfYear) => {
  // Simulate seasonal NDVI patterns
  const growthCurves = {
    rice: { peak: 180, width: 60, max: 0.85 },
    wheat: { peak: 120, width: 50, max: 0.80 },
    corn: { peak: 200, width: 55, max: 0.82 },
    cotton: { peak: 220, width: 65, max: 0.75 },
    sugarcane: { peak: 250, width: 80, max: 0.88 },
    soybean: { peak: 190, width: 50, max: 0.78 },
    default: { peak: 180, width: 60, max: 0.80 }
  };

  const curve = growthCurves[cropType?.toLowerCase()] || growthCurves.default;
  const baseNDVI = curve.max * Math.exp(-Math.pow(dayOfYear - curve.peak, 2) / (2 * Math.pow(curve.width, 2)));
  const noise = (Math.random() - 0.5) * 0.1;
  return Math.max(0.1, Math.min(1.0, baseNDVI + noise));
};

const generateSoilMoisture = (irrigationMethod, rainfall) => {
  const baseMoisture = {
    rainfed: 35,
    drip: 55,
    sprinkler: 50,
    flood: 65,
    canal: 60,
    other: 45
  };

  const base = baseMoisture[irrigationMethod] || 40;
  const rainEffect = Math.min(30, (rainfall || 0) * 0.5);
  const noise = (Math.random() - 0.5) * 15;
  return Math.max(10, Math.min(95, base + rainEffect + noise));
};

const generateSatelliteReading = (farm, recentWeather = null) => {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

  const ndvi = generateNDVI(farm.cropType, dayOfYear);
  const soilMoisture = generateSoilMoisture(farm.irrigationMethod, recentWeather?.rainfall);
  const cropGrowthIndex = Math.max(0, Math.min(1, ndvi * 0.8 + (soilMoisture / 100) * 0.2));

  return {
    farm: farm._id,
    ndvi: parseFloat(ndvi.toFixed(4)),
    soilMoisture: parseFloat(soilMoisture.toFixed(1)),
    cropGrowthIndex: parseFloat(cropGrowthIndex.toFixed(4)),
    landSurfaceTemp: 20 + Math.random() * 20,
    cloudCover: Math.random() * 40,
    source: 'simulated',
    capturedAt: now
  };
};

const generateHistoricalReadings = (farm, days = 30) => {
  const readings = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

    const ndvi = generateNDVI(farm.cropType, dayOfYear);
    const soilMoisture = generateSoilMoisture(farm.irrigationMethod);

    readings.push({
      farm: farm._id,
      ndvi: parseFloat(ndvi.toFixed(4)),
      soilMoisture: parseFloat(soilMoisture.toFixed(1)),
      cropGrowthIndex: parseFloat((ndvi * 0.8 + (soilMoisture / 100) * 0.2).toFixed(4)),
      landSurfaceTemp: 18 + Math.random() * 22,
      cloudCover: Math.random() * 50,
      source: 'simulated',
      capturedAt: date
    });
  }

  return readings;
};

module.exports = { generateSatelliteReading, generateHistoricalReadings };
