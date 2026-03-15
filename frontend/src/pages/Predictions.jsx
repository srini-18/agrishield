import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiChevronDown } from 'react-icons/fi';

const Predictions = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await api.get('/farms');
        const d = res.data.data || [];
        setFarms(d);
        if (d.length > 0) setSelectedFarm(d[0]._id);
      } catch (err) { console.error(err); }
    };
    fetchFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) fetchPredictions();
  }, [selectedFarm]);

  const fetchPredictions = async () => {
    try {
      const res = await api.get(`/predict/${selectedFarm}`);
      setPredictions(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const runAllPredictions = async () => {
    if (!selectedFarm) return;
    setLoading(true);
    try {
      toast.loading('Running AI analysis...', { id: 'ai' });
      await api.post(`/predict/all/${selectedFarm}`);
      await fetchPredictions();
      toast.success('AI predictions complete!', { id: 'ai' });
    } catch (err) {
      toast.error('Prediction failed', { id: 'ai' });
    }
    setLoading(false);
  };

  const getRiskColor = (level) => {
    const colors = { low: '#22c55e', moderate: '#f59e0b', high: '#f97316', critical: '#ef4444' };
    return colors[level] || '#94a3b8';
  };

  const getRiskBg = (level) => {
    const bg = { low: 'bg-primary-500/10', moderate: 'bg-accent-500/10', high: 'bg-orange-500/10', critical: 'bg-red-500/10' };
    return bg[level] || 'bg-white/5';
  };

  const latest = {};
  ['yield', 'drought', 'flood', 'disease'].forEach(type => {
    latest[type] = predictions.find(p => p.type === type);
  });

  const riskTypes = [
    { key: 'yield', label: 'Yield Forecast', icon: '🌾', desc: 'Predicted crop yield and health' },
    { key: 'drought', label: 'Drought Risk', icon: '☀️', desc: 'Water stress and rainfall deficit' },
    { key: 'flood', label: 'Flood Risk', icon: '🌊', desc: 'Excessive rainfall and saturation' },
    { key: 'disease', label: 'Disease Risk', icon: '🦠', desc: 'Crop disease probability' },
  ];

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">🤖 AI Risk Predictions</h1>
          <p className="page-subtitle">Machine learning-powered agricultural risk assessment</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedFarm || ''} onChange={(e) => setSelectedFarm(e.target.value)} className="select-field w-48 text-sm">
            {farms.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <button onClick={runAllPredictions} disabled={loading || !selectedFarm} className="btn-accent flex items-center gap-2 text-sm">
            <FiActivity size={14} className={loading ? 'animate-spin' : ''} /> Run Analysis
          </button>
        </div>
      </div>

      {/* Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {riskTypes.map(rt => {
          const pred = latest[rt.key];
          return (
            <div key={rt.key} className={`glass-card p-5 relative overflow-hidden ${pred ? '' : 'opacity-60'}`}>
              <div className="text-2xl mb-2">{rt.icon}</div>
              <h3 className="text-sm font-bold text-white mb-0.5">{rt.label}</h3>
              <p className="text-[10px] text-white/40 mb-3">{rt.desc}</p>

              {pred ? (
                <>
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-3xl font-bold" style={{ color: getRiskColor(pred.riskLevel) }}>{pred.riskScore?.toFixed(0)}</span>
                      <span className="text-xs text-white/40 ml-1">/ 100</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{
                      background: `${getRiskColor(pred.riskLevel)}20`,
                      color: getRiskColor(pred.riskLevel)
                    }}>{pred.riskLevel}</span>
                  </div>

                  <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{
                      width: `${pred.riskScore}%`,
                      background: getRiskColor(pred.riskLevel)
                    }}></div>
                  </div>

                  <p className="text-[10px] text-white/30">{pred.confidence?.toFixed(0)}% confidence</p>
                  {pred.predictedYield && (
                    <p className="text-xs text-primary-400 mt-1 font-medium">Yield: {pred.predictedYield} t/ha</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-white/30">Click "Run Analysis" to generate</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Analysis */}
      {Object.values(latest).some(Boolean) && (
        <div className="space-y-4">
          {riskTypes.map(rt => {
            const pred = latest[rt.key];
            if (!pred) return null;

            return (
              <div key={rt.key} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">{rt.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{rt.label} Analysis</h3>
                    <p className="text-xs text-white/40">{pred.details}</p>
                  </div>
                </div>

                {/* Factors */}
                {pred.factors?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {pred.factors.map((f, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/60">{f.name}</span>
                          <span className={`text-xs ${f.impact === 'positive' ? 'text-primary-400' : f.impact === 'negative' ? 'text-red-400' : 'text-white/40'}`}>
                            {f.impact === 'positive' ? '↑' : f.impact === 'negative' ? '↓' : '–'} {f.value}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${f.value}%`,
                            background: f.impact === 'positive' ? '#22c55e' : f.impact === 'negative' ? '#ef4444' : '#94a3b8'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {pred.recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-white/60 mb-2">💡 Recommendations</h4>
                    <div className="space-y-1">
                      {pred.recommendations.map((rec, i) => (
                        <p key={i} className="text-xs text-white/40 flex items-start gap-2">
                          <FiCheckCircle className="text-primary-400 flex-shrink-0 mt-0.5" size={12} />
                          {rec}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!Object.values(latest).some(Boolean) && (
        <div className="glass-card p-16 text-center">
          <FiActivity className="mx-auto text-white/20 mb-4" size={48} />
          <h3 className="text-lg font-bold text-white mb-2">No predictions yet</h3>
          <p className="text-white/40 text-sm mb-6">Select a farm and run AI analysis to see predictions</p>
          <button onClick={runAllPredictions} disabled={!selectedFarm} className="btn-accent">Run AI Analysis</button>
        </div>
      )}
    </div>
  );
};

export default Predictions;
