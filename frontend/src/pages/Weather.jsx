import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiCloudRain, FiRefreshCw, FiThermometer, FiDroplet, FiWind, FiSun, FiEye, FiCloud } from 'react-icons/fi';

const Weather = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await api.get('/farms');
        const farmsData = res.data.data || [];
        setFarms(farmsData);
        if (farmsData.length > 0) setSelectedFarm(farmsData[0]._id);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) fetchWeather();
  }, [selectedFarm]);

  const fetchWeather = async () => {
    try {
      const [histRes, currRes, forecastRes] = await Promise.all([
        api.get(`/weather/${selectedFarm}`),
        api.get(`/weather/${selectedFarm}/current`),
        api.get(`/weather/${selectedFarm}/forecast`)
      ]);
      setData(histRes.data.data || []);
      setCurrent(currRes.data.data);
      setForecast(forecastRes.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchNew = async () => {
    try {
      toast.loading('Fetching weather data...', { id: 'weather' });
      await api.post(`/weather/${selectedFarm}/fetch`);
      await fetchWeather();
      toast.success('Weather updated!', { id: 'weather' });
    } catch (err) { toast.error('Failed', { id: 'weather' }); }
  };

  const chartData = [...data].reverse().slice(-30).map(d => ({
    date: new Date(d.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    temp: d.temperature,
    humidity: d.humidity,
    rain: d.rainfall,
    wind: d.windSpeed
  }));

  const weatherCards = current ? [
    { label: 'Temperature', value: `${current.temperature?.toFixed(1)}°C`, icon: FiThermometer, sub: `Feels ${current.feelsLike?.toFixed(1)}°C`, color: 'text-red-400', bg: 'from-red-500/20' },
    { label: 'Humidity', value: `${current.humidity?.toFixed(0)}%`, icon: FiDroplet, sub: 'Relative', color: 'text-ocean-400', bg: 'from-ocean-500/20' },
    { label: 'Rainfall', value: `${current.rainfall?.toFixed(1)} mm`, icon: FiCloudRain, sub: 'Last reading', color: 'text-blue-400', bg: 'from-blue-500/20' },
    { label: 'Wind', value: `${current.windSpeed?.toFixed(1)} km/h`, icon: FiWind, sub: `${current.windDirection}°`, color: 'text-teal-400', bg: 'from-teal-500/20' },
    { label: 'UV Index', value: `${current.uvIndex?.toFixed(1) || '—'}`, icon: FiSun, sub: current.uvIndex > 6 ? 'High' : 'Moderate', color: 'text-accent-400', bg: 'from-accent-500/20' },
    { label: 'Visibility', value: `${current.visibility?.toFixed(1)} km`, icon: FiEye, sub: current.condition, color: 'text-purple-400', bg: 'from-purple-500/20' },
  ] : [];

  return (
    <div className="page-container">
      {/* Header — stacks on mobile */}
      <div className="page-header">
        <div className="mb-3 sm:mb-0">
          <h1 className="page-title text-xl sm:text-2xl">🌦️ Weather Intelligence</h1>
          <p className="page-subtitle text-xs sm:text-sm">Real-time weather, forecasts & historical analysis</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select value={selectedFarm || ''} onChange={(e) => setSelectedFarm(e.target.value)} className="select-field flex-1 sm:w-48 text-xs sm:text-sm min-w-0">
            {farms.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <button onClick={fetchNew} disabled={!selectedFarm} className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm flex-shrink-0 px-3 sm:px-4">
            <FiRefreshCw size={14} /> <span className="hidden sm:inline">Update</span>
          </button>
        </div>
      </div>

      {/* Current Conditions */}
      {current && (
        <div className="glass-card p-4 sm:p-5 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl">{current.icon}</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white capitalize">{current.condition?.replace('_', ' ')}</h2>
              <p className="text-[10px] sm:text-xs text-white/40">
                Current • {current.source === 'openweathermap' ? '🟢 Live' : '🔵 Simulated'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {weatherCards.map(card => (
              <div key={card.label} className="bg-white/5 rounded-xl p-2.5 sm:p-3 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br ${card.bg} to-transparent rounded-full blur-xl -translate-y-4 translate-x-4`}></div>
                <card.icon className={`${card.color} mb-1.5`} size={16} />
                <p className={`text-sm sm:text-lg font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[9px] sm:text-[10px] text-white/40">{card.label}</p>
                <p className="text-[8px] sm:text-[10px] text-white/30 hidden sm:block">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <div className="glass-card p-4 sm:p-5 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <FiCloud className="text-blue-400" size={16} />
            <h2 className="text-sm sm:text-base font-bold text-white">5-Day Forecast</h2>
            <span className="text-[9px] sm:text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded-full ml-auto">
              {forecast[0]?.source === 'openweathermap' ? '🟢 Live' : '🔵 Simulated'}
            </span>
          </div>
          {/* Horizontal scroll on very small screens, grid on larger */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
            {forecast.map((day, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-2 sm:p-4 border border-white/5 hover:border-white/10 transition-all text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-14 sm:w-20 h-14 sm:h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl -translate-y-6 translate-x-6"></div>
                <p className="text-[10px] sm:text-xs font-bold text-white mb-0.5">{day.dayName}</p>
                <p className="text-[8px] sm:text-[10px] text-white/30 mb-1 sm:mb-2 hidden sm:block">{day.date}</p>
                <p className="text-xl sm:text-3xl mb-1 sm:mb-2">{day.icon}</p>
                <p className="text-[9px] sm:text-xs text-white/50 capitalize mb-1.5 sm:mb-3 truncate hidden sm:block">{day.description}</p>
                <div className="flex justify-center items-baseline gap-0.5 mb-1 sm:mb-2">
                  <span className="text-sm sm:text-lg font-bold text-white">{day.tempMax?.toFixed(0)}°</span>
                  <span className="text-[8px] sm:text-xs text-white/30">/</span>
                  <span className="text-[10px] sm:text-sm text-white/40">{day.tempMin?.toFixed(0)}°</span>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex items-center justify-between text-[8px] sm:text-[10px]">
                    <span className="text-white/30 hidden sm:inline">Rain</span>
                    <span className="text-blue-400 font-medium mx-auto sm:mx-0">{day.pop}%🌧</span>
                  </div>
                  <div className="hidden sm:flex items-center justify-between text-[10px]">
                    <span className="text-white/30">Humidity</span>
                    <span className="text-cyan-400 font-medium">{day.humidity?.toFixed(0)}%</span>
                  </div>
                  <div className="hidden sm:flex items-center justify-between text-[10px]">
                    <span className="text-white/30">Wind</span>
                    <span className="text-teal-400 font-medium">{day.windSpeed?.toFixed(0)}km/h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts — single column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card p-4 sm:p-5">
          <h2 className="section-title text-sm sm:text-base">Temperature Trend</h2>
          <ResponsiveContainer height={220} className="sm:h-[280px]">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9 }} width={30} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 }} />
              <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <h2 className="section-title text-sm sm:text-base">Rainfall History</h2>
          <ResponsiveContainer height={220} className="sm:h-[280px]">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9 }} width={30} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 }} />
              <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <h2 className="section-title text-sm sm:text-base">Humidity Trend</h2>
          <ResponsiveContainer height={220} className="sm:h-[280px]">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="humG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9 }} domain={[0, 100]} width={30} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 }} />
              <Area type="monotone" dataKey="humidity" stroke="#06b6d4" fill="url(#humG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <h2 className="section-title text-sm sm:text-base">Wind Speed</h2>
          <ResponsiveContainer height={220} className="sm:h-[280px]">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9 }} width={30} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 }} />
              <Line type="monotone" dataKey="wind" stroke="#14b8a6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Weather;
