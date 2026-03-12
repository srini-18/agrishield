import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiCloudRain, FiRefreshCw, FiThermometer, FiDroplet, FiWind, FiSun, FiEye } from 'react-icons/fi';

const Weather = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState(null);
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
      const [histRes, currRes] = await Promise.all([
        api.get(`/weather/${selectedFarm}`),
        api.get(`/weather/${selectedFarm}/current`)
      ]);
      setData(histRes.data.data || []);
      setCurrent(currRes.data.data);
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
    { label: 'Wind Speed', value: `${current.windSpeed?.toFixed(1)} km/h`, icon: FiWind, sub: `${current.windDirection}° dir`, color: 'text-teal-400', bg: 'from-teal-500/20' },
    { label: 'UV Index', value: `${current.uvIndex?.toFixed(1) || '—'}`, icon: FiSun, sub: current.uvIndex > 6 ? 'High' : 'Moderate', color: 'text-accent-400', bg: 'from-accent-500/20' },
    { label: 'Visibility', value: `${current.visibility?.toFixed(1)} km`, icon: FiEye, sub: current.condition, color: 'text-purple-400', bg: 'from-purple-500/20' },
  ] : [];

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">🌦️ Weather Intelligence</h1>
          <p className="page-subtitle">Real-time weather monitoring and historical analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedFarm || ''} onChange={(e) => setSelectedFarm(e.target.value)} className="select-field w-48 text-sm">
            {farms.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <button onClick={fetchNew} disabled={!selectedFarm} className="btn-primary flex items-center gap-2 text-sm">
            <FiRefreshCw size={14} /> Update
          </button>
        </div>
      </div>

      {/* Current Conditions */}
      {current && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{current.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-white capitalize">{current.condition?.replace('_', ' ')}</h2>
              <p className="text-xs text-white/40">Current conditions • {current.source}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {weatherCards.map(card => (
              <div key={card.label} className="bg-white/5 rounded-xl p-3 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${card.bg} to-transparent rounded-full blur-xl -translate-y-4 translate-x-4`}></div>
                <card.icon className={`${card.color} mb-2`} size={18} />
                <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-white/40">{card.label}</p>
                <p className="text-[10px] text-white/30">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h2 className="section-title">Temperature Trend</h2>
          <ResponsiveContainer height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h2 className="section-title">Rainfall History</h2>
          <ResponsiveContainer height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h2 className="section-title">Humidity Trend</h2>
          <ResponsiveContainer height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="humG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="humidity" stroke="#06b6d4" fill="url(#humG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h2 className="section-title">Wind Speed</h2>
          <ResponsiveContainer height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Line type="monotone" dataKey="wind" stroke="#14b8a6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Weather;
