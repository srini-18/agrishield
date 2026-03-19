const express = require('express');
const router = express.Router();
const InsurancePolicy = require('../models/InsurancePolicy');
const InsuranceClaim = require('../models/InsuranceClaim');
const Farm = require('../models/Farm');
const SatelliteData = require('../models/SatelliteData');
const WeatherData = require('../models/WeatherData');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { evaluateTriggers, calculatePayout } = require('../services/insuranceService');

// @route   POST /api/insurance/enroll
// @desc    Enroll in an insurance policy
router.post('/enroll', auth, authorize('farmer'), async (req, res) => {
  try {
    const { farmId, policyType, premium, coverageAmount, triggers, season } = req.body;

    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    // Default triggers based on policy type
    let policyTriggers = triggers || [];
    if (policyTriggers.length === 0) {
      switch (policyType) {
        case 'drought':
          policyTriggers = [
            { parameter: 'rainfall', operator: 'below', threshold: 2, unit: 'mm/day' },
            { parameter: 'ndvi', operator: 'drop_by', threshold: 0.2, unit: 'index' }
          ];
          break;
        case 'flood':
          policyTriggers = [
            { parameter: 'rainfall', operator: 'above', threshold: 80, unit: 'mm/day' },
            { parameter: 'flood_level', operator: 'above', threshold: 100, unit: 'mm' }
          ];
          break;
        case 'crop_damage':
          policyTriggers = [
            { parameter: 'ndvi', operator: 'below', threshold: 0.3, unit: 'index' },
            { parameter: 'temperature', operator: 'above', threshold: 42, unit: '°C' }
          ];
          break;
        case 'comprehensive':
          policyTriggers = [
            { parameter: 'rainfall', operator: 'below', threshold: 2, unit: 'mm/day' },
            { parameter: 'rainfall', operator: 'above', threshold: 80, unit: 'mm/day' },
            { parameter: 'ndvi', operator: 'below', threshold: 0.3, unit: 'index' },
            { parameter: 'temperature', operator: 'above', threshold: 42, unit: '°C' }
          ];
          break;
      }
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const policy = new InsurancePolicy({
      farm: farmId,
      farmer: req.user._id,
      policyType,
      premium: premium || 2500,
      coverageAmount: coverageAmount || 50000,
      triggers: policyTriggers,
      season,
      expiresAt
    });

    await policy.save();
    res.status(201).json({ success: true, data: policy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/insurance/policies
// @desc    Get insurance policies
router.get('/policies', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin' && req.user.role !== 'insurer') {
      query.farmer = req.user._id;
    }

    const policies = await InsurancePolicy.find(query)
      .populate('farm', 'name cropType size location')
      .populate('farmer', 'name email')
      .sort({ enrolledAt: -1 });

    res.json({ success: true, count: policies.length, data: policies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/insurance/status/:policyId
// @desc    Get policy status with claims
router.get('/status/:policyId', auth, async (req, res) => {
  try {
    const policy = await InsurancePolicy.findById(req.params.policyId)
      .populate('farm', 'name cropType size location')
      .populate('farmer', 'name email');

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    const claims = await InsuranceClaim.find({ policy: policy._id }).sort({ triggeredAt: -1 });

    res.json({ success: true, data: { policy, claims } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/insurance/check-triggers/:farmId
// @desc    Check parametric triggers for a farm's policies
router.post('/check-triggers/:farmId', auth, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    const policies = await InsurancePolicy.find({ farm: farm._id, status: 'active' });
    if (policies.length === 0) {
      return res.json({ success: true, message: 'No active policies for this farm', data: [] });
    }

    const satelliteData = await SatelliteData.find({ farm: farm._id }).sort({ capturedAt: -1 }).limit(10);
    const weatherData = await WeatherData.find({ farm: farm._id }).sort({ recordedAt: -1 }).limit(10);

    const results = [];

    for (const policy of policies) {
      const triggeredConditions = await evaluateTriggers(policy, satelliteData, weatherData);

      if (triggeredConditions.length > 0) {
        const payoutAmount = calculatePayout(policy, triggeredConditions);

        const claim = new InsuranceClaim({
          policy: policy._id,
          farm: farm._id,
          farmer: policy.farmer,
          triggerType: triggeredConditions[0].parameter,
          triggerValue: triggeredConditions[0].currentValue,
          threshold: triggeredConditions[0].threshold,
          payoutAmount,
          description: `Automatic claim triggered: ${triggeredConditions.map(t => `${t.parameter} ${t.operator} ${t.threshold}${t.unit}`).join(', ')}`,
          status: 'approved'
        });

        await claim.save();
        policy.status = 'claimed';
        await policy.save();

        results.push({ policy: policy._id, policyNumber: policy.policyNumber, triggered: true, conditions: triggeredConditions, claim });
      } else {
        results.push({ policy: policy._id, policyNumber: policy.policyNumber, triggered: false });
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/insurance/claims
// @desc    Get all claims
router.get('/claims', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin' && req.user.role !== 'insurer') {
      query.farmer = req.user._id;
    }

    const claims = await InsuranceClaim.find(query)
      .populate('policy', 'policyNumber policyType coverageAmount')
      .populate('farm', 'name cropType')
      .populate('farmer', 'name email')
      .sort({ triggeredAt: -1 });

    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/insurance/review/:policyId
// @desc    Approve or reject an insurance policy
router.put('/review/:policyId', auth, authorize('admin', 'insurer'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    
    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const policy = await InsurancePolicy.findById(req.params.policyId);
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    policy.status = status;
    policy.reviewRemarks = remarks || '';
    policy.reviewedBy = req.user._id;
    policy.reviewedAt = new Date();
    await policy.save();

    res.json({ success: true, data: policy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
