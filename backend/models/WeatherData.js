const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  temperature: { type: Number }, // celsius
  feelsLike: { type: Number },
  humidity: { type: Number, min: 0, max: 100 }, // percentage
  rainfall: { type: Number, min: 0 }, // mm
  windSpeed: { type: Number, min: 0 }, // km/h
  windDirection: { type: Number }, // degrees
  solarRadiation: { type: Number }, // W/m²
  pressure: { type: Number }, // hPa
  visibility: { type: Number }, // km
  uvIndex: { type: Number },
  condition: { type: String }, // clear, cloudy, rain, storm, etc.
  icon: { type: String },
  source: { type: String, enum: ['openweathermap', 'simulated'], default: 'simulated' },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

weatherDataSchema.index({ location: '2dsphere' });
weatherDataSchema.index({ farm: 1, recordedAt: -1 });

module.exports = mongoose.model('WeatherData', weatherDataSchema);
