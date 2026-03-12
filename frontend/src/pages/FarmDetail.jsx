import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import MapView from '../components/MapView';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FiArrowLeft, FiSun, FiCloudRain, FiActivity, FiShield, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const FarmDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [farm, setFarm] = useState(null);
  const [satellite, setSatellite] = useState([]);
  const [weather, setWeather] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [farmRes, satRes, weatherRes, predRes] = await Promise.all([
        api.get(`/farms/${id}`),
        api.get(`/satellite/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/weather/${id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/predict/${id}`).catch(() => ({ data: { data: [] } }))
      ]);
      setFarm(farmRes.data.data);
      setSatellite(satRes.data.data || []);
      setWeather(weatherRes.data.data || []);
      setPredictions(predRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load farm data');
    }
    setLoading(false);
  };

  const runPredictions = async () => {
    try {
      toast.loading('Running AI predictions...', { id: 'predict' });
      await api.post(`/predict/all/${id}`);
      const res = await api.get(`/predict/${id}`);
      setPredictions(res.data.data || []);
      toast.success('Predictions complete!', { id: 'predict' });
    } catch (err) {
      toast.error('Prediction failed', { id: 'predict' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`${t('farms.deleteConfirm')} "${farm.name}"? ${t('farms.deleteWarning')}`)) return;
    try {
      await api.delete(`/farms/${id}`);
      toast.success(t('farms.deleted'));
      navigate('/farms');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete farm');
    }
  };

  if (loading) return <div className="page-container"><div className="glass-card h-96 loading-shimmer" /></div>;
  if (!farm) return <div className="page-container"><p className="text-white/50">Farm not found</p></div>;

  const ndviData = satellite.slice(-15).map(d => ({
    date: new Date(d.capturedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    ndvi: d.ndvi,
    moisture: d.soilMoisture
  }));

  const latestPredictions = ['yield', 'drought', 'flood', 'disease'].map(type => 
    predictions.find(p => p.type === type)
  ).filter(Boolean);

  const getRiskColor = (level) => {
    const colors = { low: '#22c55e', moderate: '#f59e0b', high: '#f97316', critical: '#ef4444' };
    return colors[level] || '#94a3b8';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={() => navigate('/farms')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-4 transition-colors">
          <FiArrowLeft size={16} /> {t('farmDetail.back')}
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{farm.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-2.5 py-1 rounded-lg bg-primary-500/15 text-primary-400 text-xs font-medium capitalize">{farm.cropType}</span>
              <span className="px-2.5 py-1 rounded-lg bg-accent-500/15 text-accent-400 text-xs font-medium">{farm.size} ha</span>
              <span className="px-2.5 py-1 rounded-lg bg-ocean-500/15 text-ocean-400 text-xs font-medium capitalize">{farm.soilType} {t('farms.soil')}</span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-medium capitalize">{farm.irrigationMethod}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={runPredictions} className="btn-primary flex items-center gap-2 text-sm">
              <FiActivity size={16} /> {t('farmDetail.runAI')}
            </button>
            <button onClick={handleDelete} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/25 hover:text-red-300 border border-red-500/20 transition-all duration-200">
              <FiTrash2 size={16} /> {t('farmDetail.deleteFarm')}
            </button>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 text-center border-primary-500/20">
          <p className="text-xs text-primary-400/70 mb-1 font-medium">{t('farmDetail.healthScore')}</p>
          <p className="text-2xl font-bold text-primary-400">{farm.healthScore || 75}%</p>
        </div>
        <div className="glass-card p-4 text-center border-accent-500/20">
          <p className="text-xs text-accent-400/70 mb-1 font-medium">{t('farmDetail.latestNDVI')}</p>
          <p className="text-2xl font-bold text-accent-400">{satellite[0]?.ndvi?.toFixed(3) || '—'}</p>
        </div>
        <div className="glass-card p-4 text-center border-ocean-500/20">
          <p className="text-xs text-ocean-400/70 mb-1 font-medium">{t('farmDetail.soilMoisture')}</p>
          <p className="text-2xl font-bold text-ocean-400">{satellite[0]?.soilMoisture?.toFixed(1) || '—'}%</p>
        </div>
        <div className="glass-card p-4 text-center border-red-500/20">
          <p className="text-xs text-red-400/70 mb-1 font-medium">{t('farmDetail.temperature')}</p>
          <p className="text-2xl font-bold text-red-400">{weather[0]?.temperature?.toFixed(1) || '—'}°C</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Map */}
        <div className="glass-card p-5">
          <h2 className="section-title">{t('farmDetail.farmLocation')}</h2>
          <MapView farms={[farm]} center={[farm.location?.coordinates?.[1] || 20, farm.location?.coordinates?.[0] || 78]} zoom={12} height="300px" />
        </div>

        {/* NDVI Chart */}
        <div className="glass-card p-5">
          <h2 className="section-title">{t('farmDetail.ndviTrend')}</h2>
          {ndviData.length > 0 ? (
            <ResponsiveContainer height={300}>
              <AreaChart data={ndviData}>
                <defs>
                  <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} domain={[0, 1]} />
                <Tooltip contentStyle={{ background: 'rgba(10,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                <Area type="monotone" dataKey="ndvi" stroke="#22c55e" fill="url(#ndviGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-white/30 text-center py-16">{t('farmDetail.noSatData')}</p>}
        </div>
      </div>

      {/* Predictions */}
      {latestPredictions.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <h2 className="section-title">{t('farmDetail.riskPredictions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestPredictions.map(pred => (
              <div key={pred.type} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white capitalize">{pred.type} Risk</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                    background: `${getRiskColor(pred.riskLevel)}20`,
                    color: getRiskColor(pred.riskLevel)
                  }}>{pred.riskLevel}</span>
                </div>
                <div className="mb-2">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{
                      width: `${pred.riskScore}%`,
                      background: getRiskColor(pred.riskLevel)
                    }}></div>
                  </div>
                </div>
                <p className="text-xs text-white/40">{pred.riskScore}% risk • {pred.confidence?.toFixed(0)}% confidence</p>
                {pred.type === 'yield' && pred.predictedYield && (
                  <p className="text-xs text-primary-400 mt-1">Predicted: {pred.predictedYield} t/ha</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('farmDetail.satelliteData'), icon: FiSun, path: '/satellite', color: 'text-accent-400', bg: 'bg-accent-500/10 border-accent-500/20 hover:bg-accent-500/20' },
          { label: t('farmDetail.weatherData'), icon: FiCloudRain, path: '/weather', color: 'text-ocean-400', bg: 'bg-ocean-500/10 border-ocean-500/20 hover:bg-ocean-500/20' },
          { label: t('farmDetail.aiPredictions'), icon: FiActivity, path: '/predictions', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20' },
          { label: t('farmDetail.insurance'), icon: FiShield, path: '/insurance', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20 hover:bg-primary-500/20' },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)} 
            className={`p-4 text-center rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${a.bg}`}>
            <a.icon className={`${a.color} mx-auto mb-2`} size={24} />
            <p className={`text-xs font-medium ${a.color}`}>{a.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FarmDetail;
