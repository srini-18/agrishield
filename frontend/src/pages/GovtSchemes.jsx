import { useLanguage } from '../context/LanguageContext';
import { FiExternalLink, FiCheckCircle, FiFileText, FiDollarSign, FiShield, FiTruck, FiCreditCard, FiGift } from 'react-icons/fi';

const schemes = [
  {
    key: 'pmfby',
    icon: FiShield,
    color: 'primary',
    url: 'https://pmfby.gov.in',
    premium: '2% Kharif • 1.5% Rabi • 5% Commercial',
    eligibility: ['All farmers (loanee & non-loanee)', 'Sharecroppers and tenant farmers', 'All food crops, oilseeds, horticulture'],
    benefits: ['Up to full sum insured for crop loss', 'Coverage: sowing to post-harvest', 'Smartphone-based crop cutting experiments'],
    documents: ['Aadhaar Card', 'Land Records / Lease Agreement', 'Bank Account Details', 'Sowing Certificate'],
  },
  {
    key: 'enam',
    icon: FiTruck,
    color: 'accent',
    url: 'https://enam.gov.in',
    premium: 'Free access • No middlemen • Direct payment',
    eligibility: ['All farmers with produce to sell', 'FPOs and farmer groups', 'Available in 1,000+ APMC mandis'],
    benefits: ['Transparent online bidding', 'Better prices through competition', 'Direct bank payment (no cash)', 'Inter-state trade support'],
    documents: ['Aadhaar Card', 'Bank Account', 'Mobile Number', 'Mandi Registration (if applicable)'],
  },
  {
    key: 'kcc',
    icon: FiCreditCard,
    color: 'ocean',
    url: 'https://www.pmkisan.gov.in/kcc',
    premium: '4% interest (with subsidy) • Up to ₹3 lakh',
    eligibility: ['All land-owning farmers', 'Tenant farmers with proof', 'Fishermen and animal husbandry farmers'],
    benefits: ['Crop production loans at 4% p.a.', 'Insurance coverage built-in', 'Can be used as ATM card', 'Loan restructuring on natural calamity'],
    documents: ['Aadhaar Card', 'Land Records (7/12 extracts)', 'Passport-size Photos', 'Identity & Address Proof'],
  },
  {
    key: 'pmkisan',
    icon: FiGift,
    color: 'purple',
    url: 'https://www.pmkisan.gov.in',
    premium: '₹6,000/year in 3 installments of ₹2,000',
    eligibility: ['All land-holding farmer families', 'Must have cultivable land', 'No income ceiling for small/marginal farmers'],
    benefits: ['Direct transfer to bank account', '₹2,000 every 4 months', 'No repayment required', 'Stackable with other schemes'],
    documents: ['Aadhaar Card', 'Land Ownership Records', 'Bank Account (Aadhaar-linked)', 'Mobile Number'],
  },
];

const colorMap = {
  primary: { bg: 'bg-primary-500/10', border: 'border-primary-500/20', text: 'text-primary-400', hover: 'hover:bg-primary-500/20' },
  accent: { bg: 'bg-accent-500/10', border: 'border-accent-500/20', text: 'text-accent-400', hover: 'hover:bg-accent-500/20' },
  ocean: { bg: 'bg-ocean-500/10', border: 'border-ocean-500/20', text: 'text-ocean-400', hover: 'hover:bg-ocean-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', hover: 'hover:bg-purple-500/20' },
};

const GovtSchemes = () => {
  const { t } = useLanguage();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('schemes.title')}</h1>
        <p className="page-subtitle">{t('schemes.subtitle')}</p>
      </div>

      {/* Quick Stats Banner */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center justify-center gap-6 text-center">
        <div>
          <p className="text-xl font-bold text-primary-400">₹30,000 Cr+</p>
          <p className="text-[10px] text-white/40">PMFBY claims paid</p>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
        <div>
          <p className="text-xl font-bold text-accent-400">1,361</p>
          <p className="text-[10px] text-white/40">e-NAM mandis</p>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
        <div>
          <p className="text-xl font-bold text-ocean-400">7.35 Cr</p>
          <p className="text-[10px] text-white/40">KCC cards issued</p>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
        <div>
          <p className="text-xl font-bold text-purple-400">11 Cr+</p>
          <p className="text-[10px] text-white/40">PM-KISAN beneficiaries</p>
        </div>
      </div>

      {/* Scheme Cards */}
      <div className="space-y-6">
        {schemes.map((scheme) => {
          const c = colorMap[scheme.color];
          return (
            <div key={scheme.key} className={`glass-card overflow-hidden border ${c.border}`}>
              {/* Header */}
              <div className={`${c.bg} p-5 border-b ${c.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                      <scheme.icon className={c.text} size={24} />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${c.text}`}>{t(`schemes.${scheme.key}`)}</h2>
                      <p className="text-xs text-white/40 mt-0.5">{scheme.premium}</p>
                    </div>
                  </div>
                  <a
                    href={scheme.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl ${c.bg} border ${c.border} ${c.text} ${c.hover} text-sm font-medium transition-all whitespace-nowrap`}
                  >
                    <FiExternalLink size={14} />
                    {t('schemes.applyNow')}
                  </a>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-sm text-white/60 mb-5">{t(`schemes.${scheme.key}Desc`)}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Eligibility */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white/70 flex items-center gap-1.5 mb-2">
                      <FiCheckCircle size={12} className={c.text} />
                      {t('schemes.eligibility') || 'Eligibility'}
                    </h3>
                    {scheme.eligibility.map((item, i) => (
                      <p key={i} className="text-[11px] text-white/50 flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.bg} border ${c.border} flex-shrink-0 mt-1`}></span>
                        {item}
                      </p>
                    ))}
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white/70 flex items-center gap-1.5 mb-2">
                      <FiDollarSign size={12} className={c.text} />
                      {t('schemes.benefits') || 'Benefits'}
                    </h3>
                    {scheme.benefits.map((item, i) => (
                      <p key={i} className="text-[11px] text-white/50 flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.bg} border ${c.border} flex-shrink-0 mt-1`}></span>
                        {item}
                      </p>
                    ))}
                  </div>

                  {/* Documents */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white/70 flex items-center gap-1.5 mb-2">
                      <FiFileText size={12} className={c.text} />
                      {t('schemes.documents') || 'Documents Required'}
                    </h3>
                    {scheme.documents.map((item, i) => (
                      <p key={i} className="text-[11px] text-white/50 flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.bg} border ${c.border} flex-shrink-0 mt-1`}></span>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GovtSchemes;
