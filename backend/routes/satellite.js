const express = require('express');
const router = express.Router();
const SatelliteData = require('../models/SatelliteData');
const Farm = require('../models/Farm');
const auth = require('../middleware/auth');
const { generateSatelliteReading, generateHistoricalReadings } = require('../services/satelliteService');

// @route   GET /api/satellite/:farmId
// @desc    Get satellite data for a farm
router.get('/:farmId', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    let data = await SatelliteData.find({ farm: req.params.farmId })
      .sort({ capturedAt: -1 })
      .limit(30);

    // If no data exists, generate historical data
    if (data.length === 0) {
      const historicalReadings = generateHistoricalReadings(farm, 30);
      data = await SatelliteData.insertMany(historicalReadings);
      data = data.reverse();
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/satellite/:farmId/fetch
// @desc    Fetch new satellite reading for a farm
router.post('/:farmId/fetch', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    const reading = generateSatelliteReading(farm);
    const satelliteData = new SatelliteData(reading);
    await satelliteData.save();

    // Update farm health score based on NDVI
    farm.healthScore = Math.round(reading.ndvi * 100);
    await farm.save();

    res.json({ success: true, data: satelliteData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/satellite/:farmId/latest
// @desc    Get latest satellite reading
router.get('/:farmId/latest', auth, async (req, res) => {
  try {
    const data = await SatelliteData.findOne({ farm: req.params.farmId })
      .sort({ capturedAt: -1 });

    if (!data) {
      const farm = await Farm.findById(req.params.farmId);
      if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
      
      const reading = generateSatelliteReading(farm);
      const newData = new SatelliteData(reading);
      await newData.save();
      return res.json({ success: true, data: newData });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
