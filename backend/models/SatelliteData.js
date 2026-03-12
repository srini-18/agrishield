const mongoose = require('mongoose');

const satelliteDataSchema = new mongoose.Schema({
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  ndvi: { type: Number, min: -1, max: 1, required: true }, // Normalized Difference Vegetation Index
  soilMoisture: { type: Number, min: 0, max: 100 }, // percentage
  cropGrowthIndex: { type: Number, min: 0, max: 1 },
  landSurfaceTemp: { type: Number }, // celsius
  cloudCover: { type: Number, min: 0, max: 100 },
  source: { type: String, enum: ['sentinel', 'eosda', 'gee', 'simulated'], default: 'simulated' },
  capturedAt: { type: Date, default: Date.now },
  metadata: {
    resolution: String,
    band: String,
    tileId: String
  }
}, { timestamps: true });

satelliteDataSchema.index({ farm: 1, capturedAt: -1 });

module.exports = mongoose.model('SatelliteData', satelliteDataSchema);
