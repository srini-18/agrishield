import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { FiShield, FiPlus, FiAlertTriangle, FiCheckCircle, FiClock, FiDollarSign, FiX } from 'react-icons/fi';

const Insurance = () => {
  const [farms, setFarms] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollData, setEnrollData] = useState({
    farmId: '', policyType: 'drought', premium: 2500, coverageAmount: 50000, season: 'Kharif 2026'
  });
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [farmsRes, polRes, claimRes] = await Promise.all([
        api.get('/farms'),
        api.get('/insurance/policies').catch(() => ({ data: { data: [] } })),
        api.get('/insurance/claims').catch(() => ({ data: { data: [] } }))
      ]);
      const farmsData = farmsRes.data.data || [];
      setFarms(farmsData);
      setPolicies(polRes.data.data || []);
      setClaims(claimRes.data.data || []);
      if (farmsData.length > 0 && !enrollData.farmId) {
        setEnrollData(d => ({ ...d, farmId: farmsData[0]._id }));
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleEnroll = async () => {
    try {
      toast.loading('Enrolling...', { id: 'enroll' });
      await api.post('/insurance/enroll', enrollData);
      await fetchAll();
      setShowEnroll(false);
      toast.success('Insurance request submitted for approval!', { id: 'enroll' });
    } catch (err) {
      toast.error('Enrollment failed', { id: 'enroll' });
    }
  };

  const checkTriggers = async (farmId) => {
    try {
      toast.loading('Checking triggers...', { id: 'trigger' });
      const res = await api.post(`/insurance/check-triggers/${farmId}`);
      await fetchAll();
      const triggered = res.data.data?.filter(r => r.triggered);
      if (triggered?.length > 0) {
        toast.success(`${triggered.length} claim(s) triggered!`, { id: 'trigger' });
      } else {
        toast.success('No triggers activated', { id: 'trigger' });
      }
    } catch (err) {
      toast.error('Check failed', { id: 'trigger' });
    }
  };

  const statusColors = {
    active: 'text-primary-400 bg-primary-500/10',
    expired: 'text-white/40 bg-white/5',
    claimed: 'text-accent-400 bg-accent-500/10',
    cancelled: 'text-red-400 bg-red-500/10',
    pending: 'text-orange-400 bg-orange-500/10',
    approved: 'text-primary-400 bg-primary-500/10',
    paid: 'text-purple-400 bg-purple-500/10',
    rejected: 'text-red-400 bg-red-500/10',
  };

  const activePolicies = policies.filter(p => p.status === 'active').length;
  const totalCoverage = policies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
  const totalClaims = claims.length;
  const totalPaid = claims.filter(c => c.status === 'approved' || c.status === 'paid').reduce((sum, c) => sum + (c.payoutAmount || 0), 0);

  if (loading) return <div className="page-container"><div className="glass-card h-96 loading-shimmer" /></div>;

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">{t('insurance.title')}</h1>
          <p className="page-subtitle">{t('insurance.subtitle')}</p>
        </div>
        <button onClick={() => setShowEnroll(true)} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={14} /> {t('insurance.enrollBtn')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <FiShield className="mx-auto text-primary-400 mb-2" size={20} />
          <p className="text-2xl font-bold text-white">{activePolicies}</p>
          <p className="text-xs text-white/40">{t('dashboard.activePolicies')}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <FiDollarSign className="mx-auto text-accent-400 mb-2" size={20} />
          <p className="text-2xl font-bold text-white">₹{(totalCoverage / 1000).toFixed(0)}K</p>
          <p className="text-xs text-white/40">{t('insurance.totalCoverage')}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <FiAlertTriangle className="mx-auto text-orange-400 mb-2" size={20} />
          <p className="text-2xl font-bold text-white">{totalClaims}</p>
          <p className="text-xs text-white/40">{t('insurance.claimsFiled')}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <FiCheckCircle className="mx-auto text-purple-400 mb-2" size={20} />
          <p className="text-2xl font-bold text-white">₹{(totalPaid / 1000).toFixed(0)}K</p>
          <p className="text-xs text-white/40">{t('insurance.payouts')}</p>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnroll && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t('insurance.enrollTitle')}</h3>
              <button onClick={() => setShowEnroll(false)} className="p-1 hover:bg-white/10 rounded-lg"><FiX className="text-white/50" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label-text">{t('insurance.farm')}</label>
                <select value={enrollData.farmId} onChange={e => setEnrollData({ ...enrollData, farmId: e.target.value })} className="select-field text-sm">
                  {farms.map(f => <option key={f._id} value={f._id}>{f.name} ({f.cropType})</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">{t('insurance.policyType')}</label>
                <select value={enrollData.policyType} onChange={e => setEnrollData({ ...enrollData, policyType: e.target.value })} className="select-field text-sm">
                  <option value="drought">Drought Protection</option>
                  <option value="flood">Flood Protection</option>
                  <option value="crop_damage">Crop Damage</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">{t('insurance.premium')} (₹)</label>
                  <input type="number" value={enrollData.premium} onChange={e => setEnrollData({ ...enrollData, premium: +e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="label-text">{t('insurance.coverage')} (₹)</label>
                  <input type="number" value={enrollData.coverageAmount} onChange={e => setEnrollData({ ...enrollData, coverageAmount: +e.target.value })} className="input-field text-sm" />
                </div>
              </div>
              <div>
                <label className="label-text">{t('insurance.season')}</label>
                <input value={enrollData.season} onChange={e => setEnrollData({ ...enrollData, season: e.target.value })} className="input-field text-sm" />
              </div>
              <button onClick={handleEnroll} className="btn-primary w-full text-sm">{t('insurance.enrollNow')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Policies */}
      <div className="glass-card p-5 mb-6">
        <h2 className="section-title">{t('farms.title')}</h2>
        {policies.length === 0 ? (
          <p className="text-white/30 text-center py-8">{t('insurance.noPolicies')}</p>
        ) : (
          <div className="space-y-3">
            {policies.map(policy => (
              <div key={policy._id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white">{policy.policyNumber}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${statusColors[policy.status]}`}>
                        {policy.status === 'pending' ? <FiClock className="inline mr-1" /> : null}
                        {policy.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 capitalize">{policy.policyType?.replace('_', ' ')} • {policy.farm?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-400">₹{policy.coverageAmount?.toLocaleString()}</p>
                    <p className="text-[10px] text-white/30">{t('insurance.coverage')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex gap-4 text-[10px] text-white/30">
                    <span>{t('insurance.premium')}: ₹{policy.premium}</span>
                    <span>{t('farmDetail.ndviTrend')}: {policy.triggers?.length || 0}</span>
                    <span>Expires: {new Date(policy.expiresAt).toLocaleDateString()}</span>
                  </div>
                  {policy.status === 'active' && (
                    <button onClick={() => checkTriggers(policy.farm?._id || policy.farm)} className="text-[10px] text-primary-400 hover:text-primary-300 font-medium">
                      {t('insurance.checkTriggers')} →
                    </button>
                  )}
                  {policy.status === 'pending' && (
                    <span className="text-[10px] text-white/20 italic">Awaiting Insurer Review</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claims */}
      <div className="glass-card p-5">
        <h2 className="section-title">{t('insurance.claimsTitle')}</h2>
        {claims.length === 0 ? (
          <p className="text-white/30 text-center py-8">{t('insurance.noClaims')}</p>
        ) : (
          <div className="space-y-3">
            {claims.map(claim => (
              <div key={claim._id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white">{claim.claimNumber}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${statusColors[claim.status]}`}>{claim.status}</span>
                    </div>
                    <p className="text-xs text-white/40">{claim.description}</p>
                    <p className="text-[10px] text-white/30 mt-1">
                      Trigger: {claim.triggerType} = {claim.triggerValue?.toFixed(2)} (threshold: {claim.threshold})
                      • {new Date(claim.triggeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-400">₹{claim.payoutAmount?.toLocaleString()}</p>
                    <p className="text-[10px] text-white/30">{t('insurance.payouts')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insurance;
