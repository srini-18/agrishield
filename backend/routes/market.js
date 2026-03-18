const express = require('express');
const router = express.Router();
const { getMarketPrices, getMarketTrends } = require('../services/marketService');

/**
 * @route   GET /api/market/prices
 * @desc    Get latest commodity prices from Agmarknet API (with fallback)
 * @access  Public
 */
router.get('/prices', async (req, res) => {
    try {
        const prices = await getMarketPrices();
        res.json({
            success: true,
            count: prices.length,
            data: prices,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Market route error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market prices'
        });
    }
});

/**
 * @route   GET /api/market/trends/:crop
 * @desc    Get price trends and AI predictions for a crop
 * @access  Public
 */
router.get('/trends/:crop', async (req, res) => {
    try {
        const { state, district } = req.query;
        const trends = await getMarketTrends(req.params.crop, state, district);
        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Market trends error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market trends'
        });
    }
});

module.exports = router;
