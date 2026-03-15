import { useState, useEffect } from 'react';
import api from '../services/api';
import MapView from '../components/MapView';
import StatCard from '../components/StatCard';
import { FiUsers, FiMap, FiShield, FiActivity, FiSearch } from 'react-icons/fi';

const AdminDashboard = () => {
  const [farmers, setFarmers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [farmersRes, farmsRes, polRes, claimsRes] = await Promise.all([
        api.get('/farmers').catch(() => ({ data: { data: [] } })),
        api.get('/farms'),
        api.get('/insurance/policies').catch(() => ({ data: { data: [] } })),
        api.get('/insurance/claims').catch(() => ({ data: { data: [] } }))
      ]);
      setFarmers(farmersRes.data.data || []);
      setFarms(farmsRes.data.data || []);
      setPolicies(polRes.data.data || []);
      setClaims(claimsRes.data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredFarmers = farmers.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCoverage = policies.reduce((s, p) => s + (p.coverageAmount || 0), 0);

  if (loading) return (
    <div className="page-container">
      <div className="grid grid-cols-4 gap-4 mb-6">{[1,2,3,4].map(i => <div key={i} className="glass-card h-28 loading-shimmer" />)}</div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚙️ Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FiUsers} label="Total Farmers" value={farmers.length} color="primary" />
        <StatCard icon={FiMap} label="Total Farms" value={farms.length} color="accent" />
        <StatCard icon={FiShield} label="Active Policies" value={policies.filter(p => p.status === 'active').length} color="ocean" />
        <StatCard icon={FiActivity} label="Claims Filed" value={claims.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Map */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="section-title">All Farms Map</h2>
          <MapView farms={farms} height="400px" />
        </div>

        {/* Coverage */}
        <div className="glass-card p-5">
          <h2 className="section-title">Insurance Overview</h2>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Total Coverage</p>
              <p className="text-2xl font-bold text-accent-400">₹{(totalCoverage / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Claims Approved</p>
              <p className="text-2xl font-bold text-primary-400">{claims.filter(c => c.status === 'approved' || c.status === 'paid').length}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Total Payouts</p>
              <p className="text-2xl font-bold text-purple-400">
                ₹{(claims.filter(c => c.status === 'approved' || c.status === 'paid').reduce((s, c) => s + (c.payoutAmount || 0), 0) / 1000).toFixed(0)}K
              </p>
            </div>

            {/* Recent Claims */}
            <div>
              <h3 className="text-xs font-medium text-white/50 mb-2">Recent Claims</h3>
              {claims.slice(0, 3).map(c => (
                <div key={c._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-xs text-white font-medium">{c.claimNumber}</p>
                    <p className="text-[10px] text-white/30">{c.triggerType}</p>
                  </div>
                  <p className="text-xs text-primary-400 font-bold">₹{c.payoutAmount?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Farmer Table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Farmer Database</h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search farmers..." className="input-field pl-9 w-64 text-sm py-2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 text-xs text-white/40 font-medium">Name</th>
                <th className="text-left py-3 text-xs text-white/40 font-medium">Email</th>
                <th className="text-left py-3 text-xs text-white/40 font-medium">Phone</th>
                <th className="text-left py-3 text-xs text-white/40 font-medium">Farms</th>
                <th className="text-left py-3 text-xs text-white/40 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map(f => (
                <tr key={f._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 text-white font-medium">{f.name}</td>
                  <td className="py-3 text-white/60">{f.email}</td>
                  <td className="py-3 text-white/60">{f.phone || '—'}</td>
                  <td className="py-3 text-white/60">{f.farmCount || 0}</td>
                  <td className="py-3 text-white/60">{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filteredFarmers.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-white/30">No farmers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
