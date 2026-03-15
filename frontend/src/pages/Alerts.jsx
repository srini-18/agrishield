import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FiSmartphone, FiMessageCircle, FiCloudRain, FiAlertTriangle, FiTrendingUp, FiGift, FiBell, FiCheck, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Alerts = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    phone: localStorage.getItem('agrishield_phone') || '',
    whatsapp: true,
    sms: true,
    weatherAlerts: true,
    riskAlerts: true,
    priceAlerts: false,
    schemeAlerts: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    localStorage.setItem('agrishield_phone', settings.phone);
    localStorage.setItem('agrishield_alerts', JSON.stringify(settings));
    toast.success(t('alerts.saved'));
  };

  const handleTestAlert = () => {
    toast.success(t('alerts.testSent') || '✅ Test alert sent!');
  };

  const alertTypes = [
    {
      key: 'weatherAlerts',
      icon: FiCloudRain,
      title: t('alerts.weatherAlerts'),
      desc: t('alerts.weatherDesc'),
      color: 'ocean',
      example: '⛈️ Heavy rainfall expected (45mm) in your Coimbatore farm area in the next 6 hours. Take protective measures for your Rice crop.'
    },
    {
      key: 'riskAlerts',
      icon: FiAlertTriangle,
      title: t('alerts.riskAlerts'),
      desc: t('alerts.riskDesc'),
      color: 'red',
      example: '🔴 High drought risk (78%) detected for Green Valley Farm. NDVI dropped to 0.32. Consider supplementary irrigation immediately.'
    },
    {
      key: 'priceAlerts',
      icon: FiTrendingUp,
      title: t('alerts.priceAlerts'),
      desc: t('alerts.priceDesc'),
      color: 'accent',
      example: '📈 Rice price ₹2,850/quintal (+₹120) at Coimbatore APMC. Best rate in 7 days! Consider selling via e-NAM.'
    },
    {
      key: 'schemeAlerts',
      icon: FiGift,
      title: t('alerts.schemeAlerts'),
      desc: t('alerts.schemeDesc'),
      color: 'primary',
      example: '🏛️ PMFBY enrollment deadline: 15 days remaining for Kharif 2026. Apply now at pmfby.gov.in. Premium: ₹2,400 for your 5ha farm.'
    },
  ];

  const colorMap = {
    ocean: { bg: 'bg-ocean-500/10', border: 'border-ocean-500/20', text: 'text-ocean-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
    accent: { bg: 'bg-accent-500/10', border: 'border-accent-500/20', text: 'text-accent-400' },
    primary: { bg: 'bg-primary-500/10', border: 'border-primary-500/20', text: 'text-primary-400' },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('alerts.title')}</h1>
        <p className="page-subtitle">{t('alerts.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="section-title flex items-center gap-2">
              <FiSmartphone className="text-primary-400" size={18} />
              {t('alerts.phone')}
            </h2>
            <input
              type="tel"
              className="input-field"
              placeholder={t('alerts.phonePlaceholder') || '+91 98765 43210'}
              value={settings.phone}
              onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
            />

            <div className="mt-4 space-y-3">
              {/* WhatsApp toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <FiMessageCircle className="text-green-400" size={16} />
                  <span className="text-sm text-green-400 font-medium">{t('alerts.whatsapp')}</span>
                </div>
                <button
                  onClick={() => handleToggle('whatsapp')}
                  className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                    settings.whatsapp ? 'bg-green-500' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    settings.whatsapp ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* SMS toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-ocean-500/10 border border-ocean-500/20">
                <div className="flex items-center gap-2">
                  <FiSmartphone className="text-ocean-400" size={16} />
                  <span className="text-sm text-ocean-400 font-medium">{t('alerts.sms')}</span>
                </div>
                <button
                  onClick={() => handleToggle('sms')}
                  className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                    settings.sms ? 'bg-ocean-500' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    settings.sms ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                <FiCheck size={16} />{t('alerts.save')}
              </button>
              <button onClick={handleTestAlert} className="btn-secondary flex items-center justify-center gap-2 text-sm">
                <FiSend size={14} />{t('alerts.sendTest')}
              </button>
            </div>
          </div>
        </div>

        {/* Alert Types */}
        <div className="lg:col-span-2 space-y-4">
          {alertTypes.map(alert => {
            const c = colorMap[alert.color];
            return (
              <div key={alert.key} className={`glass-card overflow-hidden border ${c.border}`}>
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                      <alert.icon className={c.text} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold ${c.text}`}>{alert.title}</h3>
                        {settings[alert.key] && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400">ON</span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{alert.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(alert.key)}
                    className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-0.5 flex-shrink-0 ${
                      settings[alert.key] ? 'bg-primary-500' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      settings[alert.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>

                {/* Example message preview */}
                {settings[alert.key] && (
                  <div className={`px-4 pb-4`}>
                    <div className={`${c.bg} rounded-xl p-3 border ${c.border}`}>
                      <p className="text-[10px] text-white/30 mb-1 flex items-center gap-1">
                        <FiBell size={8} /> Sample alert message:
                      </p>
                      <p className="text-xs text-white/60 leading-relaxed">{alert.example}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
