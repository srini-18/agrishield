const mongoose = require('mongoose');

const insurancePolicySchema = new mongoose.Schema({
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policyNumber: { type: String, unique: true },
  policyType: { type: String, enum: ['drought', 'flood', 'crop_damage', 'comprehensive'], required: true },
  premium: { type: Number, required: true },
  coverageAmount: { type: Number, required: true },
  triggers: [{
    parameter: { type: String, enum: ['rainfall', 'ndvi', 'temperature', 'flood_level'] },
    operator: { type: String, enum: ['below', 'above', 'drop_by'] },
    threshold: Number,
    unit: String
  }],
  status: { type: String, enum: ['pending', 'active', 'expired', 'claimed', 'rejected', 'cancelled'], default: 'pending' },
  enrolledAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  season: { type: String },
  reviewRemarks: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

// Auto-generate policy number
insurancePolicySchema.pre('save', function(next) {
  if (!this.policyNumber) {
    this.policyNumber = 'AGS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

insurancePolicySchema.index({ farmer: 1, status: 1 });
insurancePolicySchema.index({ farm: 1 });

module.exports = mongoose.model('InsurancePolicy', insurancePolicySchema);
