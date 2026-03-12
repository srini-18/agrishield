const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Farm = require('../models/Farm');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// @route   GET /api/farmers
// @desc    Get all farmers (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer' }).select('-password');
    
    // Get farm count for each farmer
    const farmersWithStats = await Promise.all(
      farmers.map(async (farmer) => {
        const farmCount = await Farm.countDocuments({ owner: farmer._id });
        return { ...farmer.toJSON(), farmCount };
      })
    );

    res.json({ success: true, count: farmers.length, data: farmersWithStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/farmers/:id
// @desc    Get farmer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const farmer = await User.findById(req.params.id).select('-password');
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    const farms = await Farm.find({ owner: farmer._id });
    res.json({ success: true, data: { ...farmer.toJSON(), farms } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/farmers/:id
// @desc    Update farmer profile
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, phone, govId } = req.body;
    const farmer = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, govId },
      { new: true, runValidators: true }
    ).select('-password');

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    res.json({ success: true, data: farmer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
