const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema({
  policy: { type: mongoose.Schema.Types.ObjectId, ref: 'InsurancePolicy', required: true },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  claimNumber: { type: String, unique: true },
  triggerType: { type: String, enum: ['rainfall', 'ndvi', 'temperature', 'flood_level'], required: true },
  triggerValue: { type: Number, required: true },
  threshold: { type: Number, required: true },
  payoutAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending' },
  description: { type: String },
  evidence: {
    satelliteDataId: { type: mongoose.Schema.Types.ObjectId, ref: 'SatelliteData' },
    weatherDataId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeatherData' }
  },
  triggeredAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
}, { timestamps: true });

insuranceClaimSchema.pre('save', function(next) {
  if (!this.claimNumber) {
    this.claimNumber = 'CLM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

insuranceClaimSchema.index({ farmer: 1, status: 1 });
insuranceClaimSchema.index({ policy: 1 });

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
