import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { FiSun, FiRefreshCw } from 'react-icons/fi';

const Satellite = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await api.get('/farms');
        const farmsData = res.data.data || [];
        setFarms(farmsData);
        if (farmsData.length > 0) {
          setSelectedFarm(farmsData[0]._id);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) fetchSatelliteData();
  }, [selectedFarm]);

  const fetchSatelliteData = async () => {
    try {
      const res = await api.get(`/satellite/${selectedFarm}`);
      setData(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchNewReading = async () => {
    try {
      toast.loading('Fetching satellite data...', { id: 'sat' });
      await api.post(`/satellite/${selectedFarm}/fetch`);
      await fetchSatelliteData();
      toast.success('New satellite reading received!', { id: 'sat' });
    } catch (err) {
      toast.error('Failed to fetch', { id: 'sat' });
    }
  };

  const chartData = [...data].reverse().slice(-30).map(d => ({
    date: new Date(d.capturedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    ndvi: d.ndvi,
    moisture: d.soilMoisture,
    growth: d.cropGrowthIndex,
    temp: d.landSurfaceTemp
  }));

  const latest = data[0];

  const getNDVIStatus = (val) => {
    if (val >= 0.7) return { label: 'Healthy', color: 'text-primary-400', bg: 'bg-primary-500/10' };
    if (val >= 0.5) return { label: 'Moderate', color: 'text-accent-400', bg: 'bg-accent-500/10' };
    if (val >= 0.3) return { label: 'Stressed', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10' };
  };

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">🛰️ Satellite Monitoring</h1>
          <p className="page-subtitle">NDVI, soil moisture, and crop growth analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedFarm || ''} onChange={(e) => setSelectedFarm(e.target.value)} className="select-field w-48 text-sm">
            {farms.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <button onClick={fetchNewReading} disabled={!selectedFarm} className="btn-primary flex items-center gap-2 text-sm">
            <FiRefreshCw size={14} /> Fetch New
          </button>
        </div>
      </div>

      {/* Current Stats */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(() => { const s = getNDVIStatus(latest.ndvi); return (
            <div className={`glass-card p-5 ${s.bg} border-l-4`} style={{ borderLeftColor: s.color.replace('text-', '').includes('primary') ? '#22c55e' : s.color.includes('accent') ? '#f59e0b' : s.color.includes('orange') ? '#f97316' : '#ef4444' }}>
              <p className="text-xs text-white/40 mb-1">NDVI Index</p>
              <p className={`text-3xl font-bold ${s.color}`}>{latest.ndvi?.toFixed(3)}</p>
              <p className={`text-xs mt-1 ${s.color}`}>{s.label} vegetation</p>
            </div>
          );})()}
          <div className="glass-card p-5">
            <p className="text-xs text-white/40 mb-1">Soil Moisture</p>
            <p className="text-3xl font-bold text-ocean-400">{latest.soilMoisture?.toFixed(1)}%</p>
            <p className="text-xs text-white/30 mt-1">Water content</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-white/40 mb-1">Crop Growth</p>
            <p className="text-3xl font-bold text-accent-400">{(latest.cropGrowthIndex * 100)?.toFixed(1)}%</p>
            <p className="text-xs text-white/30 mt-1">Growth index</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-white/40 mb-1">Surface Temp</p>
            <p className="text-3xl font-bold text-red-400">{latest.landSurfaceTemp?.toFixed(1)}°C</p>
            <p className="text-xs text-white/30 mt-1">Land surface</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h2 className="section-title">NDVI Trend</h2>
          <ResponsiveContainer height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ndviG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} domain={[0, 1]} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="ndvi" stroke="#22c55e" fill="url(#ndviG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h2 className="section-title">Soil Moisture Trend</h2>
          <ResponsiveContainer height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="moistG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="moisture" stroke="#3b82f6" fill="url(#moistG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="section-title">Crop Growth Index</h2>
          <ResponsiveContainer height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} domain={[0, 1]} />
              <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="growth" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Satellite;
