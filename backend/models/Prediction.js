const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  type: { type: String, enum: ['yield', 'disease', 'drought', 'flood'], required: true },
  riskLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'], required: true },
  riskScore: { type: Number, min: 0, max: 100, required: true },
  confidence: { type: Number, min: 0, max: 100 },
  predictedYield: { type: Number }, // tonnes per hectare (for yield predictions)
  details: { type: String },
  factors: [{
    name: String,
    value: Number,
    impact: String // positive, negative, neutral
  }],
  recommendations: [{ type: String }],
  dataUsed: {
    satelliteReadings: Number,
    weatherReadings: Number,
    historicalYears: Number
  },
  predictedAt: { type: Date, default: Date.now }
}, { timestamps: true });

predictionSchema.index({ farm: 1, type: 1, predictedAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
