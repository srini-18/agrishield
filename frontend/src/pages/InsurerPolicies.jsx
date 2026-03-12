import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { FiShield, FiActivity, FiCheck, FiX, FiInfo, FiExternalLink } from 'react-icons/fi';
import MapView from '../components/MapView';

const InsurerPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null); // farmId being analyzed
  const [farmData, setFarmData] = useState({}); // { farmId: { healthScore, predictions } }
  const { t } = useLanguage();

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    try {
      const res = await api.get('/insurance/policies');
      // Insurers see everything, but we focus on pending
      setPolicies(res.data.data.filter(p => p.status === 'pending'));
    } catch (err) {
      toast.error('Failed to fetch policies');
    }
    setLoading(false);
  };

  const runAnalysis = async (farmId) => {
    try {
      setAnalyzing(farmId);
      toast.loading('Analyzing farm land with AI...', { id: 'analyze' });
      const res = await api.post(`/predict/all/${farmId}`);
      setFarmData(prev => ({
        ...prev,
        [farmId]: {
          healthScore: res.data.healthScore,
          predictions: res.data.data
        }
      }));
      toast.success('Analysis complete', { id: 'analyze' });
    } catch (err) {
      toast.error('Analysis failed', { id: 'analyze' });
    }
    setAnalyzing(null);
  };

  const handleReview = async (policyId, status) => {
    try {
      toast.loading(`Processing ${status}...`, { id: 'review' });
      await api.put(`/insurance/review/${policyId}`, { status });
      toast.success(`Policy ${status === 'active' ? 'Approved' : 'Rejected'}`, { id: 'review' });
      fetchPolicies();
    } catch (err) {
      toast.error('Action failed', { id: 'review' });
    }
  };

  if (loading) return <div className="page-container"><div className="glass-card h-96 loading-shimmer" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🛡️ Insurance Review Portal</h1>
        <p className="page-subtitle">Review pending insurance applications and run AI risk analysis</p>
      </div>

      {policies.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FiShield className="mx-auto text-white/20 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">No Pending Applications</h3>
          <p className="text-white/40">Everything is up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {policies.map(policy => (
            <div key={policy._id} className="glass-card overflow-hidden border-white/5">
              <div className="flex flex-col lg:flex-row">
                {/* Policy Info */}
                <div className="lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <FiShield className="text-primary-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{policy.policyNumber}</h3>
                      <p className="text-xs text-white/40">{policy.season} • {policy.policyType}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-white/40 mb-1">Farmer Information</p>
                      <p className="text-sm font-medium text-white">{policy.farmer?.name}</p>
                      <p className="text-[11px] text-white/40">{policy.farmer?.email}</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-white/40 mb-1">Coverage Details</p>
                      <div className="flex justify-between items-end">
                        <p className="text-xl font-bold text-accent-400">₹{policy.coverageAmount?.toLocaleString()}</p>
                        <p className="text-xs text-white/60">Premium: ₹{policy.premium}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReview(policy._id, 'active')}
                        className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiCheck size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReview(policy._id, 'rejected')}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiX size={16} /> Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Farm & Analysis */}
                <div className="lg:w-2/3 p-6 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-white">{policy.farm?.name}</h4>
                      <p className="text-xs text-white/40">{policy.farm?.cropType} • {policy.farm?.size} ha</p>
                    </div>
                    {!farmData[policy.farm?._id] && (
                      <button 
                        onClick={() => runAnalysis(policy.farm?._id)}
                        disabled={analyzing === policy.farm?._id}
                        className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                      >
                        {analyzing === policy.farm?._id ? <FiLoader className="animate-spin" /> : <FiActivity />}
                        Analyze Risk
                      </button>
                    )}
                  </div>

                  {farmData[policy.farm?._id] ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] text-white/40 mb-1 transition-colors">Health Score</p>
                          <p className={`text-lg font-bold ${
                            farmData[policy.farm._id].healthScore >= 75 ? 'text-primary-400' : 
                            farmData[policy.farm._id].healthScore >= 50 ? 'text-accent-400' : 'text-red-400'
                          }`}>{farmData[policy.farm._id].healthScore}%</p>
                        </div>
                        {farmData[policy.farm._id].predictions.map(pred => (
                          <div key={pred.type} className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <p className="text-[10px] text-white/40 mb-1 capitalize">{pred.type} Risk</p>
                            <p className={`text-lg font-bold ${
                              pred.riskLevel === 'low' ? 'text-primary-400' : 
                              pred.riskLevel === 'moderate' ? 'text-accent-400' : 'text-red-400'
                            }`}>{pred.riskLevel}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-primary-500/5 border border-primary-500/10 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <FiInfo className="text-primary-400 mt-1" size={18} />
                          <div>
                            <p className="text-sm font-medium text-white mb-1">AI Recommendation</p>
                            <p className="text-xs text-white/60">
                              {farmData[policy.farm._id].healthScore > 80 
                                ? "Strong crop vitality detected. Recommended for approval with standard premium." 
                                : farmData[policy.farm._id].healthScore > 60 
                                ? "Moderate health detected. Monitor water stress levels before approving." 
                                : "Low health score / high risk detected. Consider increasing premium or rejecting."
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center bg-white/[0.01]">
                      <FiActivity className="text-white/10 mb-2" size={32} />
                      <p className="text-xs text-white/30 text-center px-8">Run AI land analysis to see crop health, yield predictions, and risk assessments for this farm.</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <p className="text-xs text-white/40 mb-2 flex items-center gap-2">
                       <FiMapPin /> Farm Location Preview
                    </p>
                    <div className="h-40 rounded-xl overflow-hidden border border-white/5">
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
    </div>
  );
};

const FiLoader = ({ className }) => {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
