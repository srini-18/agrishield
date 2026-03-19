import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { FiShield, FiActivity, FiCheck, FiX, FiInfo, FiMapPin, FiCloud, FiThermometer, FiDroplet, FiWind, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import MapView from '../components/MapView';

const InsurerPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [allFarms, setAllFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null);
  const [farmData, setFarmData] = useState({});
  const [farmWeather, setFarmWeather] = useState({});
  const [remarks, setRemarks] = useState({});
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [farmSearch, setFarmSearch] = useState('');
  const [farmAnalyzing, setFarmAnalyzing] = useState(null);
  const { t } = useLanguage();

  useEffect(() => { fetchPolicies(); fetchFarms(); }, []);

  const fetchPolicies = async () => {
    try {
      const res = await api.get('/insurance/policies');
      setPolicies(res.data.data.filter(p => p.status === 'pending'));
    } catch (err) {
      toast.error('Failed to fetch policies');
    }
    setLoading(false);
  };

  const fetchFarms = async () => {
    try {
      const res = await api.get('/farms');
      setAllFarms(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch farms:', err);
    }
  };

  const runAnalysis = async (farmId) => {
    try {
      setAnalyzing(farmId);
      toast.loading('Analyzing farm land with AI...', { id: 'analyze' });
      const [predRes, weatherRes] = await Promise.all([
        api.post(`/predict/all/${farmId}`),
        api.get(`/weather/${farmId}/current`).catch(() => null)
      ]);
      setFarmData(prev => ({
        ...prev,
        [farmId]: {
          healthScore: predRes.data.healthScore,
          predictions: predRes.data.data
        }
      }));
      if (weatherRes?.data?.data) {
        setFarmWeather(prev => ({ ...prev, [farmId]: weatherRes.data.data }));
      }
      toast.success('Analysis complete', { id: 'analyze' });
    } catch (err) {
      toast.error('Analysis failed', { id: 'analyze' });
    }
    setAnalyzing(null);
  };

  const runFarmAnalysis = async (farmId) => {
    try {
      setFarmAnalyzing(farmId);
      toast.loading('Running AI predictions on farm...', { id: 'farmAnalyze' });
      const [predRes, weatherRes, forecastRes] = await Promise.all([
        api.post(`/predict/all/${farmId}`),
        api.get(`/weather/${farmId}/current`).catch(() => null),
        api.get(`/weather/${farmId}/forecast`).catch(() => null)
      ]);
      setFarmData(prev => ({
        ...prev,
        [farmId]: {
          healthScore: predRes.data.healthScore,
          predictions: predRes.data.data,
          forecast: forecastRes?.data?.data || []
        }
      }));
      if (weatherRes?.data?.data) {
        setFarmWeather(prev => ({ ...prev, [farmId]: weatherRes.data.data }));
      }
      toast.success('Farm analysis complete!', { id: 'farmAnalyze' });
    } catch (err) {
      toast.error('Analysis failed', { id: 'farmAnalyze' });
    }
    setFarmAnalyzing(null);
  };

  const handleReview = async (policyId, status) => {
    try {
      toast.loading(`Processing ${status}...`, { id: 'review' });
      await api.put(`/insurance/review/${policyId}`, { 
        status, 
        remarks: remarks[policyId] || '' 
      });
      toast.success(`Policy ${status === 'active' ? 'Approved' : 'Rejected'}`, { id: 'review' });
      fetchPolicies();
    } catch (err) {
      toast.error('Action failed', { id: 'review' });
    }
  };

  const getRiskColor = (level) => {
    const colors = { low: 'text-primary-400', moderate: 'text-accent-400', high: 'text-orange-400', critical: 'text-red-400' };
    return colors[level] || 'text-white/40';
  };

  const filteredFarms = allFarms.filter(f => 
    f.name?.toLowerCase().includes(farmSearch.toLowerCase()) ||
    f.cropType?.toLowerCase().includes(farmSearch.toLowerCase()) ||
    f.owner?.name?.toLowerCase().includes(farmSearch.toLowerCase())
  );

  if (loading) return <div className="page-container"><div className="glass-card h-96 loading-shimmer" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title text-xl sm:text-2xl">🛡️ Insurance Review Portal</h1>
        <p className="page-subtitle text-xs sm:text-sm">Review pending insurance applications and run AI risk analysis</p>
      </div>

      {/* Tab Navigation — stacks nicely on mobile */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
          }`}
        >
          <FiShield className="inline mr-1.5" size={14} />
          Pending ({policies.length})
        </button>
        <button
          onClick={() => setActiveTab('farms')}
          className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'farms'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
          }`}
        >
          <FiMapPin className="inline mr-1.5" size={14} />
          Farms ({allFarms.length})
        </button>
      </div>

      {/* ===== PENDING POLICIES TAB ===== */}
      {activeTab === 'pending' && (
        <>
          {policies.length === 0 ? (
            <div className="glass-card p-10 sm:p-16 text-center">
              <FiShield className="mx-auto text-white/20 mb-4" size={40} />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Pending Applications</h3>
              <p className="text-white/40 text-sm">Everything is up to date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {policies.map(policy => (
                <div key={policy._id} className="glass-card overflow-hidden border-white/5">
                  {/* Stacks vertically on mobile, side-by-side on lg */}
                  <div className="flex flex-col lg:flex-row">
                    {/* Policy Info */}
                    <div className="lg:w-1/3 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                          <FiShield className="text-primary-400" size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-lg font-bold text-white truncate">{policy.policyNumber}</h3>
                          <p className="text-[10px] sm:text-xs text-white/40">{policy.season} • {policy.policyType}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                          <p className="text-[10px] sm:text-xs text-white/40 mb-1">Farmer</p>
                          <p className="text-xs sm:text-sm font-medium text-white">{policy.farmer?.name}</p>
                          <p className="text-[10px] sm:text-[11px] text-white/40 truncate">{policy.farmer?.email}</p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                          <p className="text-[10px] sm:text-xs text-white/40 mb-1">Coverage</p>
                          <div className="flex justify-between items-end">
                            <p className="text-lg sm:text-xl font-bold text-accent-400">₹{policy.coverageAmount?.toLocaleString()}</p>
                            <p className="text-[10px] sm:text-xs text-white/60">₹{policy.premium} premium</p>
                          </div>
                        </div>

                        {/* Remarks */}
                        <div>
                          <label className="text-[10px] sm:text-xs text-white/40 mb-1 block">Review Remarks</label>
                          <textarea
                            value={remarks[policy._id] || ''}
                            onChange={(e) => setRemarks(prev => ({ ...prev, [policy._id]: e.target.value }))}
                            placeholder="Add notes..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-primary-500/50 transition-colors"
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReview(policy._id, 'active')}
                            className="flex-1 py-2 sm:py-2.5 rounded-xl bg-primary-500 text-white font-bold text-xs sm:text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <FiCheck size={14} /> Approve
                          </button>
                          <button 
                            onClick={() => handleReview(policy._id, 'rejected')}
                            className="flex-1 py-2 sm:py-2.5 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs sm:text-sm hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <FiX size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Farm & Analysis */}
                    <div className="lg:w-2/3 p-4 sm:p-6 bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-4 gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-white truncate">{policy.farm?.name}</h4>
                          <p className="text-[10px] sm:text-xs text-white/40">{policy.farm?.cropType} • {policy.farm?.size} ha</p>
                        </div>
                        {!farmData[policy.farm?._id] && (
                          <button 
                            onClick={() => runAnalysis(policy.farm?._id)}
                            disabled={analyzing === policy.farm?._id}
                            className="btn-primary py-2 px-3 sm:px-4 text-[10px] sm:text-xs flex items-center gap-1.5 flex-shrink-0"
                          >
                            {analyzing === policy.farm?._id ? <FiLoader className="animate-spin" /> : <FiActivity />}
                            <span className="hidden sm:inline">Analyze</span> Risk
                          </button>
                        )}
                      </div>

                      {/* Weather snapshot */}
                      {farmWeather[policy.farm?._id] && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                          {[
                            { icon: FiThermometer, label: 'Temp', value: `${farmWeather[policy.farm._id].temperature?.toFixed(1)}°C`, color: 'text-red-400' },
                            { icon: FiDroplet, label: 'Humidity', value: `${farmWeather[policy.farm._id].humidity?.toFixed(0)}%`, color: 'text-cyan-400' },
                            { icon: FiCloud, label: 'Rain', value: `${farmWeather[policy.farm._id].rainfall?.toFixed(1)}mm`, color: 'text-blue-400' },
                            { icon: FiWind, label: 'Wind', value: `${farmWeather[policy.farm._id].windSpeed?.toFixed(1)}km/h`, color: 'text-teal-400' },
                          ].map(w => (
                            <div key={w.label} className="bg-white/5 rounded-lg p-2 text-center">
                              <w.icon className={`${w.color} mx-auto mb-1`} size={14} />
                              <p className={`text-xs sm:text-sm font-bold ${w.color}`}>{w.value}</p>
                              <p className="text-[8px] sm:text-[9px] text-white/30">{w.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {farmData[policy.farm?._id] ? (
                        <div className="space-y-3 sm:space-y-4 animate-fade-in">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div className="bg-white/5 rounded-xl p-2.5 sm:p-3 border border-white/5">
                              <p className="text-[9px] sm:text-[10px] text-white/40 mb-1">Health Score</p>
                              <p className={`text-base sm:text-lg font-bold ${
                                farmData[policy.farm._id].healthScore >= 75 ? 'text-primary-400' : 
                                farmData[policy.farm._id].healthScore >= 50 ? 'text-accent-400' : 'text-red-400'
                              }`}>{farmData[policy.farm._id].healthScore}%</p>
                            </div>
                            {farmData[policy.farm._id].predictions.map(pred => (
                              <div key={pred.type} className="bg-white/5 rounded-xl p-2.5 sm:p-3 border border-white/5">
                                <p className="text-[9px] sm:text-[10px] text-white/40 mb-1 capitalize">{pred.type}</p>
                                <p className={`text-base sm:text-lg font-bold ${getRiskColor(pred.riskLevel)}`}>{pred.riskLevel}</p>
                                <p className="text-[8px] sm:text-[9px] text-white/30">{pred.riskScore?.toFixed(0)}/100</p>
                              </div>
                            ))}
                          </div>

                          {/* Expandable factors */}
                          <button 
                            onClick={() => setExpandedPolicy(expandedPolicy === policy._id ? null : policy._id)}
                            className="text-[10px] sm:text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium"
                          >
                            {expandedPolicy === policy._id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                            {expandedPolicy === policy._id ? 'Hide' : 'Show'} Details
                          </button>

                          {expandedPolicy === policy._id && (
                            <div className="space-y-3 animate-fade-in">
                              {farmData[policy.farm._id].predictions.map(pred => (
                                <div key={pred.type + '-detail'} className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/5">
                                  <h5 className="text-[10px] sm:text-xs font-bold text-white mb-1.5 capitalize">{pred.type} Analysis</h5>
                                  <p className="text-[10px] sm:text-[11px] text-white/40 mb-3 leading-relaxed">{pred.details}</p>
                                  {pred.factors?.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                                      {pred.factors.map((f, i) => (
                                        <div key={i} className="bg-white/5 rounded-lg p-2">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] sm:text-[10px] text-white/60">{f.name}</span>
                                            <span className={`text-[9px] sm:text-[10px] ${f.impact === 'positive' ? 'text-primary-400' : 'text-red-400'}`}>
                                              {f.impact === 'positive' ? '↑' : '↓'} {f.value}
                                            </span>
                                          </div>
                                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{
                                              width: `${Math.min(100, f.value)}%`,
                                              background: f.impact === 'positive' ? '#22c55e' : '#ef4444'
                                            }}></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {pred.recommendations?.length > 0 && (
                                    <div>
                                      {pred.recommendations.slice(0, 2).map((rec, i) => (
                                        <p key={i} className="text-[9px] sm:text-[10px] text-white/30 flex items-start gap-1 mb-0.5">
                                          <FiCheck className="text-primary-400 mt-0.5 flex-shrink-0" size={10} /> {rec}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="bg-primary-500/5 border border-primary-500/10 rounded-xl p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <FiInfo className="text-primary-400 mt-0.5 flex-shrink-0" size={16} />
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-white mb-1">AI Recommendation</p>
                                <p className="text-[10px] sm:text-xs text-white/60 leading-relaxed">
                                  {farmData[policy.farm._id].healthScore > 80 
                                    ? "Strong crop vitality. Recommended for approval with standard premium." 
                                    : farmData[policy.farm._id].healthScore > 60 
                                    ? "Moderate health. Monitor water stress levels before approving." 
                                    : "Low health / high risk. Consider increasing premium or rejecting."
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 sm:h-48 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center bg-white/[0.01]">
                          <FiActivity className="text-white/10 mb-2" size={28} />
                          <p className="text-[10px] sm:text-xs text-white/30 text-center px-4 sm:px-8">Run AI analysis to see crop health, yield predictions, and risk assessments.</p>
                        </div>
                      )}

                      <div className="mt-4 sm:mt-6">
                        <p className="text-[10px] sm:text-xs text-white/40 mb-2 flex items-center gap-1.5">
                           <FiMapPin size={12} /> Farm Location
                        </p>
                        <div className="h-28 sm:h-40 rounded-xl overflow-hidden border border-white/5">
                           {policy.farm?.location?.coordinates && (
                             <MapView 
                               farms={[policy.farm]} 
                               center={[policy.farm.location.coordinates[1], policy.farm.location.coordinates[0]]} 
                               zoom={13} 
                               height="100%" 
                             />
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== BROWSE FARMS TAB ===== */}
      {activeTab === 'farms' && (
        <div>
          {/* Search */}
          <div className="glass-card p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                value={farmSearch}
                onChange={(e) => setFarmSearch(e.target.value)}
                placeholder="Search farms by name, crop, or farmer..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary-500/50 transition-colors"
              />
            </div>
          </div>

          {filteredFarms.length === 0 ? (
            <div className="glass-card p-10 sm:p-16 text-center">
              <FiMapPin className="mx-auto text-white/20 mb-4" size={40} />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No Farms Found</h3>
              <p className="text-white/40 text-sm">No farms match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredFarms.map(farm => (
                <div key={farm._id} className="glass-card overflow-hidden border-white/5 hover:border-white/10 transition-all">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">{farm.name}</h3>
                        <p className="text-[10px] sm:text-xs text-white/40">{farm.cropType} • {farm.size} ha • {farm.soilType}</p>
                        <p className="text-[10px] sm:text-[11px] text-white/30 mt-0.5 truncate">
                          {farm.owner?.name || 'Unknown'} • {farm.irrigationMethod}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold flex-shrink-0 ${
                        farm.healthScore >= 75 ? 'bg-primary-500/10 text-primary-400' :
                        farm.healthScore >= 50 ? 'bg-accent-500/10 text-accent-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {farm.healthScore}%
                      </div>
                    </div>

                    {/* Weather snapshot */}
                    {farmWeather[farm._id] && (
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3">
                        {[
                          { label: 'Temp', value: `${farmWeather[farm._id].temperature?.toFixed(1)}°C`, color: 'text-red-400' },
                          { label: 'Humidity', value: `${farmWeather[farm._id].humidity?.toFixed(0)}%`, color: 'text-cyan-400' },
                          { label: 'Rain', value: `${farmWeather[farm._id].rainfall?.toFixed(1)}mm`, color: 'text-blue-400' },
                          { label: 'Condition', value: farmWeather[farm._id].condition?.replace('_', ' '), color: 'text-white/60' },
                        ].map(w => (
                          <div key={w.label} className="bg-white/5 rounded-lg p-1.5 sm:p-2 text-center">
                            <p className={`text-[10px] sm:text-xs font-bold ${w.color} truncate`}>{w.value}</p>
                            <p className="text-[8px] sm:text-[9px] text-white/30">{w.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Predictions */}
                    {farmData[farm._id] ? (
                      <div className="space-y-2 sm:space-y-3 animate-fade-in">
                        <div className="grid grid-cols-5 gap-1 sm:gap-2">
                          <div className="bg-white/5 rounded-lg p-1.5 sm:p-2 text-center border border-white/5">
                            <p className="text-[8px] sm:text-[9px] text-white/40">Health</p>
                            <p className={`text-xs sm:text-sm font-bold ${
                              farmData[farm._id].healthScore >= 75 ? 'text-primary-400' :
                              farmData[farm._id].healthScore >= 50 ? 'text-accent-400' : 'text-red-400'
                            }`}>{farmData[farm._id].healthScore}%</p>
                          </div>
                          {farmData[farm._id].predictions?.map(pred => (
                            <div key={pred.type} className="bg-white/5 rounded-lg p-1.5 sm:p-2 text-center border border-white/5">
                              <p className="text-[8px] sm:text-[9px] text-white/40 capitalize truncate">{pred.type}</p>
                              <p className={`text-xs sm:text-sm font-bold ${getRiskColor(pred.riskLevel)}`}>
                                {pred.riskScore?.toFixed(0)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* 5-day Forecast */}
                        {farmData[farm._id].forecast?.length > 0 && (
                          <div>
                            <p className="text-[9px] sm:text-[10px] text-white/40 mb-1.5">5-Day Forecast</p>
                            <div className="grid grid-cols-5 gap-1">
                              {farmData[farm._id].forecast.map((day, i) => (
                                <div key={i} className="bg-white/5 rounded-lg p-1.5 sm:p-2 text-center">
                                  <p className="text-[8px] sm:text-[9px] text-white/50 font-medium">{day.dayName}</p>
                                  <p className="text-sm my-0.5">{day.icon}</p>
                                  <p className="text-[9px] sm:text-[10px] text-white/60 font-bold">{day.temperature?.toFixed(0)}°</p>
                                  <p className="text-[7px] sm:text-[8px] text-blue-400">{day.pop}%🌧</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={`rounded-lg p-2.5 sm:p-3 border ${
                          farmData[farm._id].healthScore > 70 
                            ? 'bg-primary-500/5 border-primary-500/10' 
                            : 'bg-red-500/5 border-red-500/10'
                        }`}>
                          <p className="text-[9px] sm:text-[10px] text-white/60 leading-relaxed">
                            {farmData[farm._id].healthScore > 80 
                              ? '✅ Excellent condition. Low insurance risk.'
                              : farmData[farm._id].healthScore > 60
                              ? '⚠️ Moderate conditions. Standard risk.'
                              : '🔴 High-risk farm. Careful assessment needed.'
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => runFarmAnalysis(farm._id)}
                        disabled={farmAnalyzing === farm._id}
                        className="w-full py-2 sm:py-2.5 rounded-xl bg-primary-500/10 text-primary-400 font-bold text-[10px] sm:text-xs hover:bg-primary-500/20 border border-primary-500/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {farmAnalyzing === farm._id ? (
                          <><FiLoader className="animate-spin" size={14} /> Analyzing...</>
                        ) : (
                          <><FiActivity size={14} /> Run AI Predictions</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Mini map */}
                  {farm.location?.coordinates && (
                    <div className="h-24 sm:h-28 border-t border-white/5">
                      <MapView 
                        farms={[farm]} 
                        center={[farm.location.coordinates[1], farm.location.coordinates[0]]} 
                        zoom={12} 
                        height="100%" 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FiLoader = ({ className, size }) => {
  return (
    <svg className={className} width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export default InsurerPolicies;
