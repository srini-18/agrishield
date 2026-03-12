const express = require('express');
const router = express.Router();
const Prediction = require('../models/Prediction');
const Farm = require('../models/Farm');
const SatelliteData = require('../models/SatelliteData');
const WeatherData = require('../models/WeatherData');
const auth = require('../middleware/auth');
const { predictYield, predictRisk, calculateHealthScore } = require('../services/predictionService');
const { generateHistoricalReadings } = require('../services/satelliteService');
const { generateHistoricalWeather } = require('../services/weatherService');

// @route   POST /api/predict/yield
// @desc    Run yield prediction for a farm
router.post('/yield', auth, async (req, res) => {
  try {
    const { farmId } = req.body;
    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    // Fixed IDOR: Check ownership
    if (farm.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'insurer') {
      return res.status(403).json({ success: false, message: 'Not authorized to run predictions for this farm' });
    }

    let satelliteData = await SatelliteData.find({ farm: farmId }).sort({ capturedAt: -1 }).limit(14);
    if (satelliteData.length === 0) {
      const readings = generateHistoricalReadings(farm, 14);
      satelliteData = await SatelliteData.insertMany(readings);
    }

    let weatherData = await WeatherData.find({ farm: farmId }).sort({ recordedAt: -1 }).limit(14);
    if (weatherData.length === 0) {
      const [lng, lat] = farm.location.coordinates;
      const readings = generateHistoricalWeather(lat, lng, 14).map(r => ({ ...r, farm: farm._id }));
      weatherData = await WeatherData.insertMany(readings);
    }

    const prediction = predictYield(farm, satelliteData, weatherData);
    const saved = new Prediction(prediction);
    await saved.save();

    res.json({ success: true, data: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/predict/risk
// @desc    Run risk prediction (drought, flood, disease) for a farm
router.post('/risk', auth, async (req, res) => {
  try {
    const { farmId, riskType = 'drought' } = req.body;
    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    // Fixed IDOR: Check ownership
    if (farm.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'insurer') {
      return res.status(403).json({ success: false, message: 'Not authorized to run risk analysis for this farm' });
    }

    let satelliteData = await SatelliteData.find({ farm: farmId }).sort({ capturedAt: -1 }).limit(14);
    if (satelliteData.length === 0) {
      const readings = generateHistoricalReadings(farm, 14);
      satelliteData = await SatelliteData.insertMany(readings);
    }

    let weatherData = await WeatherData.find({ farm: farmId }).sort({ recordedAt: -1 }).limit(14);
    if (weatherData.length === 0) {
      const [lng, lat] = farm.location.coordinates;
      const readings = generateHistoricalWeather(lat, lng, 14).map(r => ({ ...r, farm: farm._id }));
      weatherData = await WeatherData.insertMany(readings);
    }

    const prediction = predictRisk(farm, satelliteData, weatherData, riskType);
    const saved = new Prediction(prediction);
    await saved.save();

    res.json({ success: true, data: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/predict/:farmId
// @desc    Get all predictions for a farm
router.get('/:farmId', auth, async (req, res) => {
  try {
    // Fixed IDOR: Verify farm access before showing predictions
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }
    if (farm.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'insurer') {
      return res.status(403).json({ success: false, message: 'Not authorized to view these predictions' });
    }

    const predictions = await Prediction.find({ farm: req.params.farmId })
      .sort({ predictedAt: -1 })
      .limit(20);

    res.json({ success: true, count: predictions.length, data: predictions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/predict/all/:farmId
// @desc    Run all predictions for a farm
router.post('/all/:farmId', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    // Fixed IDOR: Check ownership
    if (farm.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'insurer') {
      return res.status(403).json({ success: false, message: 'Not authorized to run analysis for this farm' });
    }

    let satelliteData = await SatelliteData.find({ farm: farm._id }).sort({ capturedAt: -1 }).limit(14);
    if (satelliteData.length === 0) {
      const readings = generateHistoricalReadings(farm, 14);
      satelliteData = await SatelliteData.insertMany(readings);
    }

    let weatherData = await WeatherData.find({ farm: farm._id }).sort({ recordedAt: -1 }).limit(14);
    if (weatherData.length === 0) {
      const [lng, lat] = farm.location.coordinates;
      const readings = generateHistoricalWeather(lat, lng, 14).map(r => ({ ...r, farm: farm._id }));
      weatherData = await WeatherData.insertMany(readings);
    }

    const yieldPred = predictYield(farm, satelliteData, weatherData);
    const droughtPred = predictRisk(farm, satelliteData, weatherData, 'drought');
    const floodPred = predictRisk(farm, satelliteData, weatherData, 'flood');
    const diseasePred = predictRisk(farm, satelliteData, weatherData, 'disease');

    const predictions = await Prediction.insertMany([yieldPred, droughtPred, floodPred, diseasePred]);

    // Calculate and update the farm's health score
    const healthScore = calculateHealthScore(satelliteData, weatherData, predictions);
    await Farm.findByIdAndUpdate(farm._id, { healthScore });

    res.json({ success: true, data: predictions, healthScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
