import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiMenu, FiX, FiLogOut, FiUser, FiShield, FiGlobe } from 'react-icons/fi';
import { useState } from 'react';

const Navbar = ({ onToggleMobile, mobileOpen }) => {
  const { user, logout } = useAuth();
  const { lang, changeLang, languages } = useLanguage();
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-white/70 hover:text-white p-1" onClick={onToggleMobile}>
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <FiShield className="text-white" size={16} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">AgriShield</h1>
              <p className="text-[9px] sm:text-[10px] text-primary-400 font-medium -mt-0.5 tracking-wider">AI PLATFORM</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <FiGlobe className="text-primary-400" size={14} />
              <span className="text-xs text-white/70">{languages.find(l => l.code === lang)?.flag}</span>
            </button>

            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-[#131a2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px]">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { changeLang(l.code); setShowLangMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        lang === l.code
                          ? 'bg-primary-500/15 text-primary-400'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span className="font-medium">{l.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></div>
            <span className="text-xs text-white/60 capitalize">{user?.role}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
              <p className="text-[11px] text-white/40">{user?.email}</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center">
              <FiUser className="text-white" size={14} />
            </div>
            <button onClick={handleLogout} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors" title="Logout">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
