import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { FiGrid, FiMap, FiCloudRain, FiGift, FiBell } from 'react-icons/fi';

const mobileNavItems = [
  { path: '/dashboard', label: 'Home', icon: FiGrid },
  { path: '/farms', label: 'Farms', icon: FiMap },
  { path: '/weather', label: 'Weather', icon: FiCloudRain },
  { path: '/schemes', label: 'Schemes', icon: FiGift },
  { path: '/alerts', label: 'Alerts', icon: FiBell },
];

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
      <Navbar onToggleMobile={() => setMobileOpen(!mobileOpen)} mobileOpen={mobileOpen} />
      <div className="flex flex-1">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="flex-1 min-h-[calc(100vh-57px)] overflow-x-hidden pb-20 lg:pb-0 transition-all duration-300">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Enhanced for touch and safe areas */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0a0f1a]/90 backdrop-blur-2xl border-t border-white/5 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 px-1 py-1 rounded-xl transition-all duration-200 flex-1"
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                    : 'text-white/30 hover:text-white/50'
                }`}>
                  <item.icon size={20} />
                </div>
                <span className={`text-[9px] font-bold tracking-tight transition-colors ${
                    isActive ? 'text-primary-400' : 'text-white/20'
                  }`}>
                  {item.label.toUpperCase()}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
