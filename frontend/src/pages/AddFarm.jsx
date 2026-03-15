import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { FiSave, FiMapPin, FiLoader, FiCloudRain, FiThermometer, FiDroplet, FiWind, FiSun, FiPlus } from 'react-icons/fi';

const CROP_CATEGORIES = {
  cereals: ['rice', 'wheat', 'maize'],
  fiber: ['cotton', 'sugarcane'],
  oilseeds: ['soybean', 'mustard'],
  pulses: ['pulses'],
  vegetables: ['onion', 'potato', 'tomato', 'chilli'],
  spices: ['turmeric'],
  fruits: ['mango', 'banana'],
  other: ['other']
};

// ─── API helpers ─────────────────────────────────────────

// Validate land + get location name via Nominatim
const fetchLocationInfo = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data.error || !data.address || !data.address.country) {
      return { isLand: false };
    }
    const addr = data.address;
    const locationName = [addr.village, addr.town, addr.city, addr.county, addr.state]
      .filter(Boolean).slice(0, 2).join(', ');
    return {
      isLand: true,
      locationName: locationName || 'Unknown Location',
      country: addr.country || '',
      state: addr.state || '',
      district: addr.county || addr.state_district || '',
    };
  } catch {
    return { isLand: true, locationName: '' };
  }
};

// Fetch soil texture from SoilGrids (ISRIC) — returns dominant soil class
const fetchSoilData = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}&property=clay&property=sand&property=silt&depth=0-5cm&value=mean`
    );
    const data = await res.json();
    const layers = data.properties?.layers || [];

    let clay = 0, sand = 0, silt = 0;
    for (const layer of layers) {
      const val = layer.depths?.[0]?.values?.mean;
      if (layer.name === 'clay' && val != null) clay = val / 10; // g/kg → %
      if (layer.name === 'sand' && val != null) sand = val / 10;
      if (layer.name === 'silt' && val != null) silt = val / 10;
    }

    // Classify soil texture based on USDA texture triangle simplified
    let soilType = 'loamy';
    if (clay > 40) soilType = 'clay';
    else if (sand > 70) soilType = 'sandy';
    else if (silt > 60) soilType = 'silt';
    else if (clay > 25 && sand > 25) soilType = 'loamy';
    else if (sand > 50) soilType = 'sandy';
    else soilType = 'loamy';

    return { soilType, clay: clay.toFixed(1), sand: sand.toFixed(1), silt: silt.toFixed(1) };
  } catch {
    return { soilType: 'loamy', clay: '—', sand: '—', silt: '—' };
  }
};

// Fetch current weather + soil moisture from Open-Meteo (free, no key)
const fetchWeatherData = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=soil_moisture_0_to_7cm&timezone=auto&forecast_days=1`
    );
    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};

    // Average soil moisture from hourly data
    const soilMoistures = data.hourly?.soil_moisture_0_to_7cm || [];
    const avgSoilMoisture = soilMoistures.length > 0
      ? (soilMoistures.reduce((a, b) => a + b, 0) / soilMoistures.length * 100).toFixed(1)
      : '—';

    // Suggest irrigation method based on rainfall
    const dailyRain = daily.precipitation_sum?.[0] || 0;
    let suggestedIrrigation = 'rainfed';
    if (dailyRain < 2) suggestedIrrigation = 'drip';
    else if (dailyRain > 20) suggestedIrrigation = 'canal';

    return {
      temperature: current.temperature_2m?.toFixed(1) || '—',
      humidity: current.relative_humidity_2m || '—',
      rainfall: current.rain?.toFixed(1) || '0',
      windSpeed: current.wind_speed_10m?.toFixed(1) || '—',
      soilMoisture: avgSoilMoisture,
      tempMax: daily.temperature_2m_max?.[0]?.toFixed(1) || '—',
      tempMin: daily.temperature_2m_min?.[0]?.toFixed(1) || '—',
      suggestedIrrigation
    };
  } catch {
    return { temperature: '—', humidity: '—', rainfall: '—', windSpeed: '—', soilMoisture: '—', suggestedIrrigation: 'rainfed' };
  }
};

// ─── Components ─────────────────────────────────────────

const LocationPicker = ({ position, setPosition, onLocationSelected }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelected(lat, lng);
    }
  });
  return position ? <Marker position={position} /> : null;
};

const CROP_OPTIONS = {
  cereals: ['rice', 'wheat', 'maize', 'barley', 'millet', 'sorghum', 'bajra', 'ragi'],
  pulses: ['chickpea', 'lentil', 'green_gram', 'black_gram', 'pigeon_pea', 'soybean'],
  cash_crops: ['cotton', 'sugarcane', 'tobacco', 'coffee', 'tea', 'rubber'],
  oilseeds: ['groundnut', 'sunflower', 'mustard', 'sesame'],
  vegetables: ['onion', 'potato', 'tomato', 'chilli', 'garlic', 'okra', 'spinach', 'cabbage', 'cauliflower'],
  spices: ['turmeric', 'ginger', 'cumin', 'coriander'],
  fruits: ['mango', 'banana', 'papaya', 'guava', 'pomegranate', 'lemon', 'grapes'],
  other: ['coconut', 'other']
};

const AddFarm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [mapLayer, setMapLayer] = useState('satellite');
  const [locationInfo, setLocationInfo] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('cereals');
  const [formData, setFormData] = useState({
    name: '', cropType: 'rice', size: '', soilType: 'loamy', irrigationMethod: 'rainfed',
    plantingDate: '', expectedHarvestDate: ''
  });

  const mapLayers = {
    satellite: { name: '🛰️ Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    dark: { name: '🌑 Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
    street: { name: '🗺️ Street', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    terrain: { name: '⛰️ Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' },
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    // Set crop type to first available in this category
    setFormData({ ...formData, cropType: CROP_OPTIONS[cat][0] });
  };

  // Main handler: when user clicks map, fetch all data
  const handleLocationSelected = async (lat, lng) => {
    setFetchingData(true);
    let soilSuccess = true;
    let weatherSuccess = true;

    // 1. Validate land + get location name
    const locInfo = await fetchLocationInfo(lat, lng);
    if (!locInfo.isLand) {
      toast.error('🌊 This location is in the sea! Please select a valid land location.');
      setFetchingData(false);
      return;
    }
    setPosition([lat, lng]);
    setLocationInfo(locInfo);

    // 2. Fetch soil & weather in parallel
    const [soil, weather] = await Promise.all([
      fetchSoilData(lat, lng).catch(() => { soilSuccess = false; return null; }),
      fetchWeatherData(lat, lng).catch(() => { weatherSuccess = false; return null; }),
    ]);

    if (!soilSuccess || !weatherSuccess) {
      toast.error('⚠️ Some environmental data could not be fetched automatically. You can still enter it manually.');
    }

    if (soil) setSoilData(soil);
    if (weather) setWeatherData(weather);

    // 3. Auto-fill form fields
    setFormData(prev => ({
      ...prev,
      name: prev.name || `Farm at ${locInfo.locationName}`,
      soilType: soil?.soilType || prev.soilType,
      irrigationMethod: weather?.suggestedIrrigation || prev.irrigationMethod,
    }));

    toast.success(`📍 Location set for ${locInfo.locationName}`);
    setFetchingData(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) {
      toast.error('Please click on the map to set farm location');
      return;
    }
    setLoading(true);
    try {
      await api.post('/farms', {
        ...formData,
        latitude: position[0],
        longitude: position[1]
      });
      toast.success('Farm registered successfully!');
      navigate('/farms');
    } catch (err) {
      console.error('Farm registration error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create farm';
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('addFarm.title')}</h1>
        <p className="page-subtitle">{t('addFarm.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="text-primary-400" />
                <h2 className="section-title mb-0">{t('addFarm.setLocation')}</h2>
              </div>
              <p className="text-xs text-white/40 mb-3">{t('addFarm.clickMap')}</p>
              <div className="rounded-xl overflow-hidden border border-white/10 relative" style={{ height: '400px' }}>
                <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                  <TileLayer key={mapLayer} url={mapLayers[mapLayer].url} maxZoom={19} />
                  <LocationPicker position={position} setPosition={setPosition} onLocationSelected={handleLocationSelected} />
                </MapContainer>

                {/* Layer toggle */}
                <div className="absolute top-2 right-2 z-[1000] flex gap-1 bg-[#0a0f1a]/85 backdrop-blur-md rounded-lg p-1 border border-white/10">
                  {Object.entries(mapLayers).map(([key, layer]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMapLayer(key)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        mapLayer === key
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {layer.name}
                    </button>
                  ))}
                </div>

                {/* Fetching overlay */}
                {fetchingData && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] rounded-xl">
                    <div className="flex items-center gap-3 bg-[#0a0f1a]/90 px-5 py-3 rounded-xl border border-white/10">
                      <div className="w-5 h-5 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
                      <div>
                        <p className="text-sm text-white font-medium">Fetching location data…</p>
                        <p className="text-[10px] text-white/40">Soil, weather & geo data</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {position && locationInfo && (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-primary-400" size={12} />
                    <span className="text-xs text-white/70">{locationInfo.locationName}{locationInfo.country ? `, ${locationInfo.country}` : ''}</span>
                  </div>
                  <div className="flex gap-4 text-[11px] text-white/40">
                    <span>Lat: {position[0].toFixed(6)}</span>
                    <span>Lng: {position[1].toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-fetched Data Cards */}
            {position && (soilData || weatherData) && (
              <div className="grid grid-cols-2 gap-3">
                {/* Soil Card */}
                {soilData && (
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-bold text-white/70 mb-3 flex items-center gap-1.5">
                      🟫 Soil Analysis
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40">Type</span>
                        <span className="text-xs font-semibold text-primary-400 capitalize">{soilData.soilType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40">Clay</span>
                        <span className="text-[11px] text-white/60">{soilData.clay}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40">Sand</span>
                        <span className="text-[11px] text-white/60">{soilData.sand}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40">Silt</span>
                        <span className="text-[11px] text-white/60">{soilData.silt}%</span>
                      </div>
                      {weatherData?.soilMoisture && (
                        <div className="flex justify-between items-center pt-1 border-t border-white/5">
                          <span className="text-[11px] text-white/40">Moisture</span>
                          <span className="text-[11px] text-ocean-400">{weatherData.soilMoisture}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Weather Card */}
                {weatherData && (
                  <div className="glass-card p-4">
                    <h3 className="text-xs font-bold text-white/70 mb-3 flex items-center gap-1.5">
                      🌤️ Current Weather
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40 flex items-center gap-1"><FiThermometer size={10} /> Temp</span>
                        <span className="text-xs font-semibold text-accent-400">{weatherData.temperature}°C</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40">Range</span>
                        <span className="text-[11px] text-white/60">{weatherData.tempMin}° – {weatherData.tempMax}°</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40 flex items-center gap-1"><FiDroplet size={10} /> Humidity</span>
                        <span className="text-[11px] text-ocean-400">{weatherData.humidity}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40 flex items-center gap-1"><FiCloudRain size={10} /> Rain</span>
                        <span className="text-[11px] text-white/60">{weatherData.rainfall} mm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/40 flex items-center gap-1"><FiWind size={10} /> Wind</span>
                        <span className="text-[11px] text-white/60">{weatherData.windSpeed} km/h</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="glass-card p-5">
            <h2 className="section-title">{t('addFarm.farmDetails')}</h2>
            {soilData && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <FiLoader className="text-primary-400" size={14} />
                <span className="text-xs text-primary-300">{t('addFarm.autoFilled')}</span>
              </div>
            )}
            <div className="space-y-4">
              {/* Row 1: Name and Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">{t('addFarm.farmName')}</label>
                  <input name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="e.g., Green Valley Farm" required />
                </div>
                <div>
                  <label className="label-text">{t('addFarm.farmSize')}</label>
                  <input name="size" type="number" step="0.1" value={formData.size} onChange={handleChange} className="input-field" placeholder="e.g., 5.5" required />
                </div>
              </div>

              {/* Row 2: Crop Type (Category) and Specific Crop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">{t('addFarm.cropCategory')}</label>
                  <select value={selectedCategory} onChange={handleCategoryChange} className="select-field">
                    {Object.keys(CROP_OPTIONS).map(cat => (
                      <option key={cat} value={cat}>{t(`cropCategory.${cat}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">{t('addFarm.cropType')}</label>
                  <select name="cropType" value={formData.cropType} onChange={handleChange} className="select-field">
                    {CROP_OPTIONS[selectedCategory].map(crop => (
                      <option key={crop} value={crop}>{t(`crop.${crop}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Soil and Irrigation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">
                    Soil Type
                    {soilData && <span className="text-primary-400 text-[10px] ml-1">(auto-detected)</span>}
                  </label>
                  <select name="soilType" value={formData.soilType} onChange={handleChange} className="select-field">
                    <option value="clay">Clay</option>
                    <option value="sandy">Sandy</option>
                    <option value="loamy">Loamy</option>
                    <option value="silt">Silt</option>
                    <option value="peat">Peat</option>
                    <option value="chalk">Chalk</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">
                    Irrigation Method
                    {weatherData && <span className="text-primary-400 text-[10px] ml-1">(suggested)</span>}
                  </label>
                  <select name="irrigationMethod" value={formData.irrigationMethod} onChange={handleChange} className="select-field">
                    <option value="rainfed">Rainfed</option>
                    <option value="drip">Drip</option>
                    <option value="sprinkler">Sprinkler</option>
                    <option value="flood">Flood</option>
                    <option value="canal">Canal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">{t('addFarm.plantingDate')}</label>
                  <input name="plantingDate" type="date" value={formData.plantingDate} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label-text">{t('addFarm.harvestDate')}</label>
                  <input name="expectedHarvestDate" type="date" value={formData.expectedHarvestDate} onChange={handleChange} className="input-field" />
                </div>
              </div>

              <button type="submit" disabled={loading || !position} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><FiPlus size={16} /> {t('addFarm.register')}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddFarm;
