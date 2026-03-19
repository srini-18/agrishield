const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// Validate that coordinates are on land using Nominatim reverse geocoding
const validateLandLocation = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'AgriShield/1.0' } }
    );
    const data = await res.json();
    if (data.error || !data.address || !data.address.country) {
      return false;
    }
    return true;
  } catch {
    // Fail-open if the API is unavailable
    return true;
  }
};

// @route   POST /api/farms
// @desc    Create a new farm
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Farm name is required'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required'),
  body('size').isFloat({ min: 0.1 }).withMessage('Farm size must be at least 0.1 hectares'),
  body('cropType').notEmpty().withMessage('Crop type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, latitude, longitude, boundary, size, cropType, soilType, irrigationMethod, plantingDate, expectedHarvestDate, historicalYield } = req.body;

    // Validate that the location is on land
    const isLand = await validateLandLocation(parseFloat(latitude), parseFloat(longitude));
    if (!isLand) {
      return res.status(400).json({ success: false, message: 'Invalid location — coordinates appear to be in water. Please select a land location.' });
    }

    const farm = new Farm({
      owner: req.user._id,
      name,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      boundary: boundary ? {
        type: 'Polygon',
        coordinates: boundary
      } : undefined,
      size: parseFloat(size),
      cropType,
      soilType,
      irrigationMethod,
      plantingDate,
      expectedHarvestDate,
      historicalYield
    });

    await farm.save();
    res.status(201).json({ success: true, data: farm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/farms
// @desc    Get farms (user's farms or all for admin)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin' && req.user.role !== 'insurer') {
      query.owner = req.user._id;
    }

    const farms = await Farm.find(query).populate('owner', 'name email phone');
    res.json({ success: true, count: farms.length, data: farms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/farms/:id
// @desc    Get farm by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id).populate('owner', 'name email phone');
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    // Fixed IDOR: Check if the user is authorized to view this farm
    if (farm.owner._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'insurer') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this farm' });
    }

    res.json({ success: true, data: farm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/farms/:id
// @desc    Update farm
router.put('/:id', [
  auth,
  body('name').optional().trim().notEmpty().withMessage('Farm name cannot be empty'),
  body('size').optional().isFloat({ min: 0.1 }).withMessage('Farm size must be at least 0.1 hectares'),
  body('cropType').optional().notEmpty().withMessage('Crop type is required'),
  body('latitude').optional().isFloat().withMessage('Valid latitude is required'),
  body('longitude').optional().isFloat().withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let farm = await Farm.findById(req.params.id);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    // Role check: Only owner or admin can update
    if (farm.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this farm' });
    }

    const updates = { ...req.body };
    
    // Handle location updates
    if (updates.latitude && updates.longitude) {
      const isLand = await validateLandLocation(parseFloat(updates.latitude), parseFloat(updates.longitude));
      if (!isLand) {
        return res.status(400).json({ success: false, message: 'Invalid location — coordinates appear to be in water.' });
      }
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(updates.longitude), parseFloat(updates.latitude)]
      };
      // Prevent original lat/lng from being in the root updates if not careful (mongoose schema handles this)
      delete updates.latitude;
      delete updates.longitude;
    }

    // Protection: Don't allow changing owner via PUT
    delete updates.owner;

    farm = await Farm.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: farm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/farms/:id
// @desc    Delete farm
router.delete('/:id', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    if (farm.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Farm.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Farm deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/farms/nearby/:lng/:lat/:distance
// @desc    Find farms near a location (Privacy protected)
router.get('/nearby/:lng/:lat/:distance', auth, async (req, res) => {
  try {
    const { lng, lat, distance } = req.params;
    
    // Privacy filter: Users see only their own, Admins/Insurers see all (or within distance)
    const query = {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(distance) * 1000 // km to meters
        }
      }
    };

    if (req.user.role !== 'admin' && req.user.role !== 'insurer') {
      query.owner = req.user._id;
    }

    const farms = await Farm.find(query).populate('owner', 'name email');
    res.json({ success: true, count: farms.length, data: farms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
