const express = require('express');
const router = express.Router();
const WeatherData = require('../models/WeatherData');
const Farm = require('../models/Farm');
const auth = require('../middleware/auth');
const { getWeatherData, generateHistoricalWeather } = require('../services/weatherService');

// @route   GET /api/weather/:farmId
// @desc    Get weather data for a farm
router.get('/:farmId', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    let data = await WeatherData.find({ farm: req.params.farmId })
      .sort({ recordedAt: -1 })
      .limit(30);

    // If no data exists, generate historical data
    if (data.length === 0) {
      const [lng, lat] = farm.location.coordinates;
      const historicalReadings = generateHistoricalWeather(lat, lng, 30);
      const readingsWithFarm = historicalReadings.map(r => ({ ...r, farm: farm._id }));
      data = await WeatherData.insertMany(readingsWithFarm);
      data = data.reverse();
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/weather/:farmId/fetch
// @desc    Fetch latest weather data for a farm
router.post('/:farmId/fetch', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    const [lng, lat] = farm.location.coordinates;
    const weatherReading = await getWeatherData(lat, lng);
    weatherReading.farm = farm._id;

    const weatherData = new WeatherData(weatherReading);
    await weatherData.save();

    res.json({ success: true, data: weatherData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/weather/:farmId/current
// @desc    Get current weather (live fetch)
router.get('/:farmId/current', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    const [lng, lat] = farm.location.coordinates;
    const weather = await getWeatherData(lat, lng);

    res.json({ success: true, data: weather });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
