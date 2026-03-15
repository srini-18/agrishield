import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiMap, FiSun, FiCloudRain, FiActivity, FiShield, FiUsers, FiGift, FiBell, FiTrendingUp } from 'react-icons/fi';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/farms', label: 'Farms', icon: FiMap },
  { path: '/satellite', label: 'Satellite', icon: FiSun },
  { path: '/weather', label: 'Weather', icon: FiCloudRain },
  { path: '/predictions', label: 'AI Predict', icon: FiActivity },
  { path: '/insurance', label: 'Insurance', icon: FiShield },
  { path: '/schemes', label: 'Govt Schemes', icon: FiGift },
  { path: '/market', label: 'Market Prices', icon: FiTrendingUp },
  { path: '/alerts', label: 'Alerts', icon: FiBell },
];

const adminItems = [
  { path: '/admin', label: 'Admin Panel', icon: FiUsers },
];

const insurerItems = [
  { path: '/insurer/policies', label: 'Insurance Review', icon: FiShield },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user } = useAuth();
  let items = [...navItems];
  if (user?.role === 'admin') items = [...items, ...adminItems, ...insurerItems];
  else if (user?.role === 'insurer') items = [...items, ...insurerItems];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:sticky top-[57px] left-0 z-40 h-[calc(100vh-57px)]
        w-[240px] bg-[#0a0f1a]/80 backdrop-blur-2xl border-r border-white/5
        flex flex-col py-6 px-4 transition-all duration-500 ease-in-out
        lg:translate-x-0 ${mobileOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full'}
      `}>
        <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-300 group
                ${isActive 
                  ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/5 text-primary-400 border border-primary-500/20 shadow-lg shadow-primary-500/5' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'}`
              }
            >
              <item.icon size={19} className="flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
              <span className="tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="border-t border-white/5 pt-6 mt-4">
          <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></div>
              <span className="text-[11px] font-bold text-white/80 tracking-widest uppercase">Network status</span>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed font-medium">All AgriShield AI nodes are currently operational.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
