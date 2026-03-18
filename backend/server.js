const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.warn('⚠️ WARNING: FRONTEND_URL is not set in production. CORS may block requests.');
}

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server running without database. Some features will be unavailable.');
  }
};

connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AgriShield AI API',
    status: 'running',
    health: '/api/health'
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/farmers', require('./routes/farmers'));
app.use('/api/farms', require('./routes/farms'));
app.use('/api/satellite', require('./routes/satellite'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/predict', require('./routes/predictions'));
app.use('/api/insurance', require('./routes/insurance'));
app.use('/api/market', require('./routes/market'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AgriShield AI Backend',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AgriShield AI Backend running on port ${PORT}`);
});
