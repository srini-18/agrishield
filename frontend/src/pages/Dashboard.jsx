import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import MapView from '../components/MapView';
import { FiMap, FiSun, FiCloudRain, FiShield, FiActivity, FiTrendingUp, FiAlertTriangle, FiPlus, FiGift, FiBell } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFarms: 0, avgHealth: 0, activePolicies: 0, predictions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const farmsRes = await api.get('/farms');
      const farmsData = farmsRes.data.data || [];
      setFarms(farmsData);

      let activePolicies = 0;
      try {
        const insRes = await api.get('/insurance/policies');
        activePolicies = (insRes.data.data || []).filter(p => p.status === 'active').length;
      } catch {}

      const avgHealth = farmsData.length > 0
        ? Math.round(farmsData.reduce((sum, f) => sum + (f.healthScore || 75), 0) / farmsData.length)
        : 0;

      setStats({
        totalFarms: farmsData.length,
        avgHealth,
        activePolicies,
        predictions: farmsData.length * 4
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="glass-card h-32 loading-shimmer" />)}
        </div>
        <div className="glass-card h-96 loading-shimmer" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">{t('dashboard.welcome')}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{t('dashboard.title')}</p>
        </div>
        <button onClick={() => navigate('/farms/add')} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> {t('farms.addFarm')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FiMap} label={t('dashboard.totalFarms')} value={stats.totalFarms} color="primary" />
        <StatCard icon={FiSun} label={t('dashboard.avgHealth')} value={`${stats.avgHealth}%`} color="accent" trend={3.2} />
        <StatCard icon={FiShield} label={t('dashboard.activePolicies')} value={stats.activePolicies} color="ocean" />
        <StatCard icon={FiActivity} label={t('dashboard.alerts')} value={stats.predictions} color="purple" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">{t('farmDetail.farmLocation') || 'Farm Overview Map'}</h2>
              <span className="text-xs text-white/40">{farms.length} {t('farms.registered')}</span>
            </div>
            <MapView 
              farms={farms} 
              height="380px" 
              onFarmClick={(farm) => navigate(`/farms/${farm._id}`)}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-card p-5">
            <h2 className="section-title">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: t('farms.addFarm'), icon: FiPlus, path: '/farms/add', color: 'text-primary-400' },
                { label: t('nav.satellite'), icon: FiSun, path: '/satellite', color: 'text-accent-400' },
                { label: t('nav.weather'), icon: FiCloudRain, path: '/weather', color: 'text-ocean-400' },
                { label: t('nav.schemes'), icon: FiGift, path: '/schemes', color: 'text-purple-400' },
                { label: t('nav.alerts'), icon: FiBell, path: '/alerts', color: 'text-red-400' },
              ].map(action => (
                <button key={action.path} onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left group">
                  <action.icon className={`${action.color} group-hover:scale-110 transition-transform`} size={18} />
                  <span className="text-sm text-white/70 group-hover:text-white transition-colors">{action.label}</span>
                  <FiTrendingUp className="ml-auto text-white/20 group-hover:text-white/40 transition-colors" size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Farms */}
          <div className="glass-card p-5">
            <h2 className="section-title">{t('farms.title')}</h2>
            {farms.length === 0 ? (
              <div className="text-center py-8">
                <FiMap className="mx-auto text-white/20 mb-3" size={32} />
                <p className="text-white/40 text-sm">{t('farms.noFarms')}</p>
                <button onClick={() => navigate('/farms/add')} className="btn-primary text-xs mt-3 px-4 py-2">{t('farms.addFarm')}</button>
              </div>
            ) : (
              <div className="space-y-2">
                {farms.slice(0, 4).map(farm => (
                  <button key={farm._id} onClick={() => navigate(`/farms/${farm._id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      farm.healthScore >= 75 ? 'bg-primary-500/20 text-primary-400' :
                      farm.healthScore >= 50 ? 'bg-accent-500/20 text-accent-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      🌾
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{farm.name}</p>
                      <p className="text-xs text-white/40">{farm.cropType} • {farm.size} ha</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        farm.healthScore >= 75 ? 'text-primary-400' :
                        farm.healthScore >= 50 ? 'text-accent-400' : 'text-red-400'
                      }`}>{farm.healthScore || 75}%</p>
                      <p className="text-[10px] text-white/30">{t('farms.healthScore')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
