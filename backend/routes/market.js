const express = require('express');
const router = express.Router();
const { getMarketPrices } = require('../services/marketService');

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

module.exports = router;
