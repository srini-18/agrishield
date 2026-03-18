import { useState, useMemo, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiSearch, FiFilter, FiActivity, FiMapPin, FiRefreshCw, FiList, FiGrid, FiArrowRight, FiPieChart } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const MarketPrices = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [region, setRegion] = useState('All');
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'market', or 'demand'

  // Regions and Districts mapping
  const REGIONS = ['All', 'Haryana', 'MP', 'Gujarat', 'UP', 'Bihar', 'Tamil Nadu', 'Maharashtra', 'Karnataka', 'Rajasthan', 'Andhra Pradesh', 'Assam', 'Kerala', 'Delhi'];
  
  const DISTRICTS = {
    'All': [],
    'Haryana': ['Karnal', 'Hisar', 'Ambala', 'Sirsa'],
    'MP': ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur'],
    'Gujarat': ['Rajkot', 'Ahmedabad', 'Surat', 'Vadodara'],
    'UP': ['Agra', 'Lucknow', 'Kanpur', 'Bareilly'],
    'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
    'Tamil Nadu': ['Erode', 'Chennai', 'Coimbatore', 'Madurai'],
    'Maharashtra': ['Nashik', 'Pune', 'Mumbai', 'Nagpur'],
    'Karnataka': ['Kolar', 'Bangalore', 'Mysore', 'Hubli'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Andhra Pradesh': ['Guntur', 'Vijayawada', 'Visakhapatnam', 'Nellore'],
    'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
    'Delhi': ['Azadpur', 'Najafgarh', 'Narela']
  };

  const [district, setDistrict] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [trends, setTrends] = useState([]);
  const [trendInsight, setTrendInsight] = useState('');
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    fetchPrices();
    fetchTrends(selectedCrop, region, district);
  }, []);

  useEffect(() => {
    fetchTrends(selectedCrop, region, district);
  }, [selectedCrop, region, district]);

  // Reset district when region changes
  useEffect(() => {
    setDistrict('All');
  }, [region]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/market/prices');
      if (response.data.success) {
        setPrices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching market prices:', error);
      toast.error('Failed to connect to live market API. Using offline data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async (crop, state = 'All', dist = 'All') => {
    setTrendLoading(true);
    try {
      const response = await api.get(`/market/trends/${crop}?state=${state}&district=${dist}`);
      if (response.data.success) {
        const { history, predictions, insight } = response.data.data;
        // Combine history and predictions for the chart
        setTrends([...history, ...predictions]);
        setTrendInsight(insight);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setTrendLoading(false);
    }
  };

  // No local prices array needed here anymore, using the 'prices' state

  const trendData = [
    { month: 'Oct', price: 3800 },
    { month: 'Nov', price: 3950 },
    { month: 'Dec', price: 4100 },
    { month: 'Jan', price: 4050 },
    { month: 'Feb', price: 4200 },
    { month: 'Mar', price: 4200 },
  ];

  const filteredPrices = useMemo(() => {
    return prices.filter(p => 
      (category === 'All' || p.category === category) &&
      (region === 'All' || p.state === region) &&
      (district === 'All' || p.district === district) &&
      (p.crop.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.state.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, category, region, district, prices]);

  // Group filtered prices by market
  const markets = useMemo(() => {
    const groups = {};
    filteredPrices.forEach(item => {
      if (!groups[item.market]) {
        groups[item.market] = {
          name: item.market,
          state: item.state,
          crops: [],
          topCrops: []
        };
      }
      groups[item.market].crops.push(item);
    });
    
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredPrices]);

  // Group filtered prices by crop for Demand Map
  const cropDemand = useMemo(() => {
    const groups = {};
    filteredPrices.forEach(item => {
      if (!groups[item.crop]) {
        groups[item.crop] = {
          name: item.crop,
          category: item.category,
          states: {}
        };
      }
      if (!groups[item.crop].states[item.state] || item.demand === 'high') {
         groups[item.crop].states[item.state] = item;
      }
    });
    
    return Object.values(groups).map(crop => ({
      ...crop,
      stateList: Object.values(crop.states).sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.demand] - order[b.demand];
      })
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredPrices]);

  return (
    <div className="page-container">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('market.title')}</h1>
          <p className="page-subtitle">{t('market.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-white/40 hover:text-white'}`}
              title="Table View"
            >
              <FiList size={18} />
            </button>
            <button 
              onClick={() => setViewMode('market')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'market' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-white/40 hover:text-white'}`}
              title="Market View"
            >
              <FiGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('demand')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'demand' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-white/40 hover:text-white'}`}
              title="Demand Map"
            >
              <FiPieChart size={18} />
            </button>
          </div>
          <button 
            onClick={fetchPrices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50 h-full"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            {loading ? 'Updating...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="section-title mb-1 capitalize">{t('market.trendTitle')} ({selectedCrop})</h2>
                <p className="text-xs text-white/40">30-day history with 7-day AI prediction</p>
              </div>
              <select 
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500 transition-colors capitalize"
              >
                {['rice', 'wheat', 'maize', 'cotton', 'soybean', 'mustard', 'onion', 'potato', 'tomato'].map(c => (
                  <option key={c} value={c} className="bg-[#0a0f1a]">{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 rounded-lg text-primary-400 border border-primary-500/20">
              <FiActivity size={14} className={trendLoading ? 'animate-pulse' : ''} />
              <span className="text-sm font-bold">AI Prediction Active</span>
            </div>
          </div>
          <div className="h-[250px] w-full relative">
            {trendLoading && (
              <div className="absolute inset-0 z-10 bg-[#0a0f1a]/50 flex items-center justify-center rounded-xl backdrop-blur-sm">
                <div className="w-8 h-8 border-3 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={4}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#3b82f6' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}
                  formatter={(value, name, props) => [
                    `₹${value}`, 
                    props.payload.type === 'prediction' ? 'AI Predicted' : 'Market Price'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  connectNulls
                  data={trends.filter(d => d.type === 'history')}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorPred)" 
                  data={trends.filter(d => d.type === 'prediction' || d === trends[trends.findIndex(i => i.type === 'prediction') - 1])}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {trendInsight && (
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                <FiActivity size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">AI Insights & Forecast</h4>
                <p className="text-[11px] text-white/50 leading-relaxed font-medium">{trendInsight}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="glass-card p-5 bg-gradient-to-br from-primary-500/10 to-transparent">
            <FiActivity className="text-primary-400 mb-3" size={24} />
            <h3 className="text-sm font-bold text-white mb-1">{t('market.sentiment')}</h3>
            <p className="text-xs text-white/50 leading-relaxed">Overall bullish trend in cereals due to high export demand. Fiber prices remain volatile.</p>
          </div>
          <div className="glass-card p-5 bg-gradient-to-br from-accent-500/10 to-transparent">
            <FiTrendingUp className="text-accent-400 mb-3" size={24} />
            <h3 className="text-sm font-bold text-white mb-1">{t('market.sellingWindow')}</h3>
            <p className="text-xs text-white/50 leading-relaxed">Next 2 weeks predicted to see 3-5% price hike for Wheat and soybean. Hold stock if possible.</p>
          </div>
        </div>
      </div>

      {/* Price Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-xs">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                type="text" 
                placeholder="Search crop or market..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-start md:justify-end">
              <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                {['All', 'Cereals', 'Cash Crops', 'Oilseeds', 'Pulses', 'Spices', 'Vegetables', 'Fruits'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${category === cat ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {t(`market.category.${cat.toLowerCase().replace(' ', '_')}`) || cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Region & District Filter */}
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/40 mb-1">
                <FiMapPin size={14} className="text-primary-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t('market.region')} (State)</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <div className="flex gap-1.5">
                  {REGIONS.map(reg => (
                    <button
                      key={reg}
                      onClick={() => setRegion(reg)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        region === reg 
                          ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/20' 
                          : 'bg-white/5 text-white/40 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {reg === 'All' ? t('market.allRegions') : reg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {region !== 'All' && DISTRICTS[region] && (
              <div className="space-y-3 animate-slide-down">
                <div className="flex items-center gap-2 text-white/40 mb-1">
                  <FiFilter size={14} className="text-primary-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Select District</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setDistrict('All')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        district === 'All' 
                          ? 'bg-primary-400/20 text-primary-400 border-primary-400/50' 
                          : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
                      }`}
                    >
                      All Districts
                    </button>
                    {DISTRICTS[region].map(dist => (
                      <button
                        key={dist}
                        onClick={() => setDistrict(dist)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                          district === dist 
                            ? 'bg-primary-400/20 text-primary-400 border-primary-400/50' 
                            : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
                        }`}
                      >
                        {dist}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-white/40 text-sm animate-pulse tracking-wide font-medium">Fetching Live Market Data...</p>
            </div>
          ) : viewMode === 'table' ? (
            <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-wider text-white/40">
                <th className="px-6 py-4 font-semibold">Commodity</th>
                <th className="px-6 py-4 font-semibold">Market / State</th>
                <th className="px-6 py-4 font-semibold">Price (₹)</th>
                <th className="px-6 py-4 font-semibold">Demand</th>
                <th className="px-6 py-4 font-semibold">24h Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPrices.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">
                        {t(`crop.${item.crop}`) || item.crop} {item.variety ? `(${item.variety})` : ''}
                      </span>
                      <span className="text-[10px] text-white/30">{t(`market.category.${item.category.toLowerCase().replace(' ', '_')}`) || item.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-white/70 font-medium">{item.market}</span>
                      <span className="text-[10px] text-white/30 uppercase tracking-tight">{item.district}, {item.state}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">₹{item.price.toLocaleString()}</span>
                      <span className="text-[10px] text-white/40">per {item.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      item.demand === 'high' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      item.demand === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-white/5 text-white/30 border border-white/10'
                    }`}>
                      {t(`market.demand.${item.demand}`)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1 text-xs font-bold ${item.change > 0 ? 'text-green-400' : item.change < 0 ? 'text-red-400' : 'text-white/30'}`}>
                      {item.change > 0 ? <FiTrendingUp size={12} /> : item.change < 0 ? <FiTrendingDown size={12} /> : null}
                      {item.change > 0 ? `+${item.change}%` : item.change === 0 ? 'Stable' : `${item.change}%`}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPrices.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-white/20 text-sm">
                    No market data found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          ) : viewMode === 'market' ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((m) => (
                <div key={m.name} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-primary-500/50 transition-all group shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors uppercase tracking-tight">{m.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                        <FiMapPin size={10} className="text-primary-500" />
                        {m.state}
                      </div>
                    </div>
                    <div className="bg-primary-500/10 text-primary-400 text-[10px] px-2 py-1 rounded font-bold">
                      {m.crops.length} Commodities
                    </div>
                  </div>

                  <div className="space-y-3">
                    {m.crops.map((crop) => (
                      <div key={crop.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white/90">
                            {t(`crop.${crop.crop}`) || crop.crop}
                          </span>
                          <span className="text-[9px] text-white/30 truncate max-w-[100px] italic">
                            {crop.variety || 'Standard'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white">₹{crop.price.toLocaleString()}</div>
                          <div className={`text-[9px] font-bold ${crop.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {crop.change > 0 ? '+' : ''}{crop.change}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary-500/5 hover:bg-primary-500 text-primary-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all border border-primary-500/20 group/btn">
                    View Market Insights
                    <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
              {markets.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/20 text-sm italic">
                  No marketplaces found with the selected filters.
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {cropDemand.map((crop) => (
                <div key={crop.name} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary-500/30 transition-all flex flex-col gap-6">
                   <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                       <h3 className="text-xl font-black text-white capitalize">{t(`crop.${crop.name}`) || crop.name}</h3>
                       <span className="text-xs text-white/30 font-bold uppercase tracking-widest">{crop.category}</span>
                     </div>
                     <div className="flex gap-2">
                        <div className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[10px] font-bold uppercase">
                          {crop.stateList.filter(s => s.demand === 'high').length} High Demand States
                        </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {crop.stateList.map((st) => (
                        <div key={st.state} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-white/90">{st.state}</span>
                             <span className="text-[10px] text-white/30 italic">{st.market} Market</span>
                           </div>
                           <div className="flex flex-col items-end">
                             <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                               st.demand === 'high' ? 'bg-green-500 text-white' :
                               st.demand === 'medium' ? 'bg-yellow-500 text-black' :
                               'bg-white/10 text-white/40'
                             }`}>
                               {st.demand}
                             </div>
                             <div className="text-xs font-bold text-white/60 mt-1">₹{st.price}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
              {cropDemand.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/20 text-sm italic">
                   No demand data found for the selected crops.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketPrices;
