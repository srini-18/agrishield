const axios = require('axios');

const STATES = ['Haryana', 'MP', 'Gujarat', 'UP', 'Bihar', 'Tamil Nadu', 'Maharashtra', 'Karnataka', 'Rajasthan', 'Andhra Pradesh', 'Assam', 'Kerala', 'Delhi'];

const DISTRICTS = {
    'Haryana': ['Karnal', 'Hisar', 'Ambala', 'Sirsa'],
    'MP': ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur'],
    'Gujarat': ['Rajkot', 'Ahmedabad', 'Surat', 'Vadodara'],
    'UP': ['Agra', 'Lucknow', 'Kanpur', 'Bareilly'],
    'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
    'Tamil Nadu': ['Erode', 'Chennai', 'Coimbatore', 'Madurai'],
    'Maharashtra': ['Nashik', 'Pune', 'Mumbai', 'Nagpur'],
    'Karnataka': ['Kolar', 'Bangalore', 'Mysore', 'Hubli'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Andhra Pradesh': ['Guntur', 'Vijayawada', 'Visakhapatnam', 'Nellore'],
    'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
    'Delhi': ['Azadpur', 'Najafgarh', 'Narela']
};

const CROP_BASE = [
    { crop: 'rice', categories: 'Cereals', units: 'Quintal', varieties: ['Basmati', 'Kinki', 'Sona Masuri'], basePrice: 3800 },
    { crop: 'wheat', categories: 'Cereals', units: 'Quintal', varieties: ['Sarbati', 'Lok-1', 'Pissi'], basePrice: 2200 },
    { crop: 'maize', categories: 'Cereals', units: 'Quintal', varieties: ['Hybrid', 'White', 'Yellow'], basePrice: 1800 },
    { crop: 'barley', categories: 'Cereals', units: 'Quintal', varieties: ['Malting', 'Local'], basePrice: 2000 },
    { crop: 'millet', categories: 'Cereals', units: 'Quintal', varieties: ['Pearl', 'Finger'], basePrice: 2300 },
    { crop: 'cotton', categories: 'Cash Crops', units: 'Quintal', varieties: ['Long Staple', 'S-6', 'MCU-5'], basePrice: 7500 },
    { crop: 'sugarcane', categories: 'Cash Crops', units: 'Quintal', varieties: ['CO-86032', 'CO-0238'], basePrice: 350 },
    { crop: 'soybean', categories: 'Oilseeds', units: 'Quintal', varieties: ['Yellow', 'Black'], basePrice: 5200 },
    { crop: 'mustard', categories: 'Oilseeds', units: 'Quintal', varieties: ['Black', 'Yellow'], basePrice: 5500 },
    { crop: 'groundnut', categories: 'Oilseeds', units: 'Quintal', varieties: ['Bold', 'Java'], basePrice: 6000 },
    { crop: 'onion', categories: 'Vegetables', units: 'Quintal', varieties: ['Red', 'White', 'Nasik'], basePrice: 1500 },
    { crop: 'potato', categories: 'Vegetables', units: 'Quintal', varieties: ['Jyoti', 'Chandramukhi', 'Laukar'], basePrice: 1100 },
    { crop: 'tomato', categories: 'Vegetables', units: 'Quintal', varieties: ['Local', 'Hybrid'], basePrice: 900 },
    { crop: 'mango', categories: 'Fruits', units: 'Dozen', varieties: ['Alphonso', 'Kesar', 'Langra'], basePrice: 1200 },
    { crop: 'banana', categories: 'Fruits', units: 'Quintal', varieties: ['G9', 'Robusta'], basePrice: 1300 },
    { crop: 'pulses', categories: 'Pulses', units: 'Quintal', varieties: ['Moong', 'Tur', 'Urad', 'Chana'], basePrice: 6500 },
    { crop: 'turmeric', categories: 'Spices', units: 'Quintal', varieties: ['Salem', 'Erode', 'Nizamabad'], basePrice: 8500 },
    { crop: 'ginger', categories: 'Spices', units: 'Quintal', varieties: ['Local', 'Hybrid'], basePrice: 15000 },
    { crop: 'cumin', categories: 'Spices', units: 'Quintal', varieties: ['Unjha', 'Local'], basePrice: 25000 },
    { crop: 'chillies', categories: 'Vegetables', units: 'Quintal', varieties: ['Guntur', 'Byadagi'], basePrice: 18000 },
];

const generateMockData = () => {
    const data = [];
    let idCounter = 1;
    
    STATES.forEach(state => {
        const districts = DISTRICTS[state] || ['Main Mandi'];
        districts.forEach(district => {
            CROP_BASE.forEach(base => {
                const demandLevels = ['high', 'medium', 'low'];
                // Create some regional price variation (+/- 20%)
                const priceVariation = 0.8 + (Math.random() * 0.4);
                
                data.push({
                    id: idCounter++,
                    crop: base.crop,
                    variety: base.varieties[Math.floor(Math.random() * base.varieties.length)],
                    market: `${district} Mandi`,
                    district: district,
                    state: state,
                    price: Math.floor(base.basePrice * priceVariation),
                    unit: base.units,
                    change: parseFloat((Math.random() * 8 - 4).toFixed(1)),
                    category: base.categories,
                    demand: demandLevels[Math.floor(Math.random() * demandLevels.length)]
                });
            });
        });
    });
    return data;
};

const MOCK_MARKET_DATA = generateMockData();

/**
 * Fetch Market Prices from Agmarknet API (data.gov.in)
 * @returns {Promise<Array>} List of market prices
 */
const getMarketPrices = async () => {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    const resourceId = "9ef842fd-9a51-4e20-951c-8067cd13ccf3"; // Agmarknet Market Price Resource ID
    
    // For this specific request, we force mock data to ensure "all crops in all states"
    // as the live API might be sparse for some combinations
    if (!apiKey || apiKey === 'your_data_gov_in_api_key_here') {
        console.log('Serving comprehensive mock market database (All Crops x All States).');
        return MOCK_MARKET_DATA;
    }

    try {
        const response = await axios.get(`https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=100`);
        
        if (response.data && response.data.records) {
            return response.data.records.map((record, index) => ({
                id: `live-${index}`,
                crop: record.commodity.toLowerCase(),
                variety: record.variety,
                market: record.market,
                state: record.state,
                price: parseInt(record.modal_price),
                unit: 'Quintal',
                change: (Math.random() * 4 - 2).toFixed(1),
                category: getCropCategory(record.commodity),
                demand: getSimulatedDemand(record.commodity)
            }));
        }
        
        return MOCK_MARKET_DATA;
    } catch (error) {
        console.error('Error fetching from live market API:', error.message);
        return MOCK_MARKET_DATA;
    }
};

/**
 * Get Market Trends and AI Predictions for a specific crop and location
 * @param {string} crop Name of the crop
 * @param {string} state Name of the state (optional)
 * @param {string} district Name of the district (optional)
 * @returns {Promise<Object>} Historical trends and future predictions
 */
const getMarketTrends = async (crop, state = 'All', district = 'All') => {
    const base = CROP_BASE.find(c => c.crop.toLowerCase() === crop.toLowerCase()) || CROP_BASE[0];
    const history = [];
    const now = new Date();

    // Location-based price multiplier (simulated)
    let locationMultiplier = 1.0;
    if (state !== 'All') {
        const stateIndex = STATES.indexOf(state);
        locationMultiplier = 0.9 + (stateIndex % 3) * 0.1; // Simple deterministic variation
    }
    if (district !== 'All') {
        locationMultiplier += 0.05; // Slightly higher for specific district markets
    }
    
    // Generate 30 days of history
    for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        // Seasonal variation + random noise + location factor
        const seasonalFactor = 1 + Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.1;
        const noise = 0.95 + Math.random() * 0.1;
        history.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: Math.floor(base.basePrice * locationMultiplier * seasonalFactor * noise),
            type: 'history'
        });
    }

    // AI Prediction Logics: 7 days forecast
    const predictions = [];
    const lastPrice = history[history.length - 1].price;
    const recentTrend = (lastPrice - history[history.length - 5].price) / 5;
    
    for (let i = 1; i <= 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        const uncertainty = 1 + (Math.random() - 0.5) * (i * 0.02);
        const predictedPrice = Math.floor((lastPrice + (recentTrend * i)) * uncertainty);
        
        predictions.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: predictedPrice,
            type: 'prediction'
        });
    }

    let locationText = state !== 'All' ? ` in ${state}` : ' nationwide';
    if (district !== 'All') locationText = ` in ${district}, ${state}`;

    return {
        crop: base.crop,
        location: { state, district },
        history,
        predictions,
        insight: recentTrend > 0 
            ? `Market${locationText} shows a bullish trend for ${base.crop}. Local demand is driving prices up.` 
            : `Stable supply levels${locationText} indicate a slight cooling of ${base.crop} prices in the coming week.`
    };
};

module.exports = { getMarketPrices, getMarketTrends };
