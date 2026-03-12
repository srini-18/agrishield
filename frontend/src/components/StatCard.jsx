const StatCard = ({ icon: Icon, label, value, sublabel, color = 'primary', trend, className = '' }) => {
  const colorMap = {
    primary: { bg: 'from-primary-500/20 to-primary-600/10', icon: 'text-primary-400', glow: 'shadow-primary-500/10' },
    accent: { bg: 'from-accent-500/20 to-accent-600/10', icon: 'text-accent-400', glow: 'shadow-accent-500/10' },
    ocean: { bg: 'from-ocean-500/20 to-ocean-600/10', icon: 'text-ocean-400', glow: 'shadow-ocean-500/10' },
    red: { bg: 'from-red-500/20 to-red-600/10', icon: 'text-red-400', glow: 'shadow-red-500/10' },
    purple: { bg: 'from-purple-500/20 to-purple-600/10', icon: 'text-purple-400', glow: 'shadow-purple-500/10' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div className={`stat-card ${c.glow} animate-fade-in ${className}`}>
      {/* Background gradient orb */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${c.bg} rounded-full blur-2xl -translate-y-4 translate-x-4 opacity-60`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
            {Icon && <Icon className={c.icon} size={20} />}
          </div>
          {trend && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend > 0 ? 'text-primary-400 bg-primary-500/10' : 'text-red-400 bg-red-500/10'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white mb-0.5">{value}</h3>
        <p className="text-sm text-white/50">{label}</p>
        {sublabel && <p className="text-xs text-white/30 mt-1">{sublabel}</p>}
      </div>
    </div>
  );
};

export default StatCard;
