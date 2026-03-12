const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  boundary: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], default: undefined }
  },
  size: { type: Number, required: true }, // in hectares
  cropType: { type: String, required: true, trim: true },
  soilType: { type: String, enum: ['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalk', 'other'], default: 'loamy' },
  irrigationMethod: { type: String, enum: ['rainfed', 'drip', 'sprinkler', 'flood', 'canal', 'other'], default: 'rainfed' },
  plantingDate: { type: Date },
  expectedHarvestDate: { type: Date },
  historicalYield: [{
    year: Number,
    yield: Number, // tonnes per hectare
    cropType: String
  }],
  status: { type: String, enum: ['active', 'fallow', 'harvested'], default: 'active' },
  healthScore: { type: Number, min: 0, max: 100, default: 75 }
}, { timestamps: true });

// Geospatial index
farmSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Farm', farmSchema);
