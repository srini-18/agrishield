import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { FiPlus, FiMap, FiDroplet, FiSun, FiChevronRight, FiTrash2 } from 'react-icons/fi';

const Farms = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await api.get('/farms');
        setFarms(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchFarms();
  }, []);

  const handleDelete = async (e, farmId, farmName) => {
    e.stopPropagation();
    if (!window.confirm(`${t('farms.deleteConfirm')} "${farmName}"? ${t('farms.deleteWarning')}`)) return;
    try {
      await api.delete(`/farms/${farmId}`);
      setFarms(farms.filter(f => f._id !== farmId));
      toast.success(t('farms.deleted'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete farm');
    }
  };

  const getHealthGradient = (score) => {
    if (score >= 75) return 'from-primary-500/20 to-primary-600/5';
    if (score >= 50) return 'from-accent-500/20 to-accent-600/5';
    if (score >= 25) return 'from-orange-500/20 to-orange-600/5';
    return 'from-red-500/20 to-red-600/5';
  };

  const getHealthColor = (score) => {
    if (score >= 75) return 'text-primary-400';
    if (score >= 50) return 'text-accent-400';
    if (score >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass-card h-48 loading-shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">{t('farms.title')}</h1>
          <p className="page-subtitle">{farms.length} {t('farms.registered')}</p>
        </div>
        <button onClick={() => navigate('/farms/add')} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> {t('farms.addFarm')}
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <FiMap className="text-primary-400" size={36} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t('farms.noFarms')}</h3>
          <p className="text-white/40 mb-6 max-w-sm mx-auto">{t('farms.noFarmsDesc')}</p>
          <button onClick={() => navigate('/farms/add')} className="btn-primary">
            <FiPlus className="inline mr-2" size={16} /> {t('farms.registerFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm, i) => (
            <div key={farm._id} onClick={() => navigate(`/farms/${farm._id}`)}
              className="glass-card-hover p-5 cursor-pointer relative overflow-hidden animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getHealthGradient(farm.healthScore || 75)} rounded-full blur-2xl -translate-y-8 translate-x-8`}></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-0.5">{farm.name}</h3>
                    <p className="text-xs text-white/40 capitalize">{farm.status || 'active'}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getHealthColor(farm.healthScore || 75)}`}>{farm.healthScore || 75}%</p>
                      <p className="text-[10px] text-white/30">{t('farms.healthScore')}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, farm._id, farm.name)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-all duration-200"
                      title={t('farms.delete')}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-xs text-white/40 mb-0.5">{t('farms.crop')}</p>
                    <p className="text-sm font-medium text-white capitalize">{farm.cropType}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-xs text-white/40 mb-0.5">{t('farms.size')}</p>
                    <p className="text-sm font-medium text-white">{farm.size} ha</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-xs text-white/40 mb-0.5">{t('farms.soil')}</p>
                    <p className="text-sm font-medium text-white capitalize">{farm.soilType}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1"><FiDroplet size={12} /> {farm.irrigationMethod}</span>
                  </div>
                  <FiChevronRight className="text-white/30" size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Farms;
