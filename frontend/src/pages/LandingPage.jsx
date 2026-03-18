import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiShield, FiCloud, FiTrendingUp, FiMap, FiBarChart2,
  FiCheckCircle, FiArrowRight, FiMenu, FiX, FiStar,
  FiZap, FiGlobe, FiDroplet
} from 'react-icons/fi';

/* ─── Animated Counter ─── */
const AnimatedCounter = ({ target, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let cur = 0;
        const step = target / 60;
        const t = setInterval(() => {
          cur += step;
          if (cur >= target) { setCount(target); clearInterval(t); }
          else setCount(Math.floor(cur));
        }, 2000 / 60);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

/* ─── Hook: Strict JS Scroll Lock Sequence ─── */
const useScrollLockSequence = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentProgress = 0;
    const increment = 0.0015; // Sensitivity of the scroll wheel

    const handleWheel = (e) => {
      // Disable scroll lock sequence on mobile/tablet
      if (window.innerWidth < 1024) {
        document.body.style.overflow = '';
        return;
      }

      // If we are not at the very top of the page, let natural scrolling happen
      if (window.scrollY > 10 && currentProgress >= 1) return;

      // We are at the top, intercept scroll
      if (currentProgress < 1 || (currentProgress >= 1 && e.deltaY < 0)) {
        e.preventDefault(); // Prevent actual page from scrolling
        
        currentProgress += e.deltaY * increment;
        currentProgress = Math.max(0, Math.min(1, currentProgress));
        setProgress(currentProgress);

        // Lock body overflow while in the sequence
        if (currentProgress < 1) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    };

    // Passive false is REQUIRED to use e.preventDefault()
    window.addEventListener('wheel', handleWheel, { passive: false });

    // Initial check
    if (window.scrollY === 0 && window.innerWidth >= 1024) document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = ''; // Cleanup on unmount
    };
  }, []);

  return progress;
};

/* ─── Feature Card ─── */
const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <div className="feature-card group" style={{ animationDelay: delay }}>
    <div className={`feature-icon-wrap ${color}`}><Icon size={24} className="text-white" /></div>
    <h3 className="text-xl font-bold text-white mt-5 mb-3">{title}</h3>
    <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
    <div className="mt-5 flex items-center gap-2 text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
      Learn more <FiArrowRight size={14} />
    </div>
  </div>
);

/* ─── Testimonial Card ─── */
const TestimonialCard = ({ name, location, text, stars }) => (
  <div className="testimonial-card">
    <div className="flex gap-1 mb-4">
      {Array.from({ length: stars }).map((_, i) => (
        <FiStar key={i} size={14} className="text-accent-400" style={{ fill: '#f59e0b' }} />
      ))}
    </div>
    <p className="text-white/70 text-sm leading-relaxed mb-5 italic">"{text}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{name[0]}</div>
      <div>
        <p className="text-white font-semibold text-sm">{name}</p>
        <p className="text-white/40 text-xs">{location}</p>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const videoRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Strict JS Scroll lock sequence
  const scrollProgress = useScrollLockSequence();

  // Multi-Phase Logic:
  // Phase 1: Text Reveal (0.0 -> 0.5)
  // Phase 2: Card Reveal (0.4 -> 1.0)
  // Phase 3: Natural Scroll (Hero section scrolls up with the page)

  // 1. Static Video Background
  const videoTranslateY = 0; 
  const videoScale      = 1; 
  
  // 2. Text Reveal
  const textRevealStart = 0.0;
  const textRevealEnd   = 0.50;
  // On mobile, show text immediately if sequence is disabled
  const textSubProgress = window.innerWidth < 1024 ? 1 : Math.min(1, scrollProgress / textRevealEnd);
  const textOpacity     = textSubProgress;

  // 3. Card Reveal (Sequential after text)
  const cardRevealStart = 0.40;
  const cardRevealEnd   = 1.0;
  const cardSubProgress = Math.max(0, Math.min(1, (scrollProgress - cardRevealStart) / (cardRevealEnd - cardRevealStart)));
  
  // Staggered reveal for cards
  const getCardStyle = (delay) => {
    const p = Math.max(0, Math.min(1, (cardSubProgress - delay) / 0.4));
    return {
      opacity: p,
      transform: `translate3d(0, ${(1 - p) * 30}px, 0) 
                  rotateX(${p * scrollProgress * 15}deg) 
                  rotateZ(${p * scrollProgress * 2}deg)`,
      transition: 'opacity 0.4s ease-out, transform 0.1s linear'
    };
  };

  const card1Style = getCardStyle(0.0);
  const card2Style = getCardStyle(0.15);
  const card3Style = getCardStyle(0.3);

  // 4. Hero remains fully visible as it scrolls up naturally
  const heroOpacity = 1;
  const heroScale   = 1;

  // For mobile where scrollProgress is 0 (since wheel is disabled)
  const mobileProgress = window.innerWidth < 1024 ? 1 : scrollProgress;

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const features = [
    { icon: FiShield,     title: 'Smart Crop Insurance',   desc: 'AI-powered risk scoring and instant claim settlements — no paperwork.',              color: 'bg-gradient-to-br from-primary-600 to-primary-800', delay: '0ms'   },
    { icon: FiCloud,      title: 'Real-time Weather AI',   desc: 'Hyper-local forecasts updated every 15 min with crop-specific advisory.',             color: 'bg-gradient-to-br from-ocean-600 to-ocean-800',   delay: '80ms'  },
    { icon: FiTrendingUp, title: 'Market Intelligence',    desc: 'Live mandi prices, demand trends, best time-to-sell recommendations.',               color: 'bg-gradient-to-br from-accent-600 to-accent-800', delay: '160ms' },
    { icon: FiMap,        title: 'Satellite Farm View',    desc: 'NDVI crop health monitoring with sub-field level satellite imagery.',                  color: 'bg-gradient-to-br from-earth-600 to-earth-800',   delay: '240ms' },
    { icon: FiBarChart2,  title: 'Yield Predictions',      desc: 'ML models trained on 10 years of data to forecast harvest with 98% accuracy.',       color: 'bg-gradient-to-br from-primary-700 to-ocean-700', delay: '320ms' },
    { icon: FiZap,        title: 'Instant Alerts',         desc: 'Pest outbreaks, frost, disease — delivered to your phone before they strike.',        color: 'bg-gradient-to-br from-accent-700 to-primary-700', delay: '400ms' },
  ];

  const stats = [
    { value: 12000, suffix: '+',  label: 'Farmers Protected',   icon: FiGlobe        },
    { value: 98,    suffix: '%',  label: 'Prediction Accuracy', icon: FiZap          },
    { value: 50,    suffix: '+',  label: 'Crops Supported',     icon: FiDroplet      },
    { value: 200,   prefix: '₹', suffix: 'Cr+', label: 'Claims Settled', icon: FiCheckCircle },
  ];

  const testimonials = [
    { name: 'Rajesh Kumar', location: 'Punjab, India',        stars: 5, text: 'AgriShield AI predicted unseasonal rains 3 days early. I harvested in time and saved my entire wheat crop.' },
    { name: 'Sunita Devi',  location: 'Maharashtra, India',   stars: 5, text: 'The insurance claim settled within 48 hours — no paperwork. This platform is a blessing for farmers like us.' },
    { name: 'Mohan Singh',  location: 'Uttar Pradesh, India', stars: 5, text: 'Market price alerts helped me sell at the right moment. I earned 30% more than the previous season.' },
  ];

  return (
    <div className="landing-root">

      {/* ═══ NAVBAR ═══ */}
      <nav className={`landing-nav ${navScrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="logo-icon"><FiShield size={20} className="text-white" /></div>
            <span className="logo-text">AgriShield <span className="text-primary-400">AI</span></span>
          </Link>
          <div className="nav-links">
            <a href="#features"     className="nav-link">Features</a>
            <a href="#stats"        className="nav-link">Impact</a>
            <a href="#testimonials" className="nav-link">Stories</a>
          </div>
          <div className="nav-ctas">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-btn-ghost">Dashboard</Link>
                <button onClick={handleLogout} className="nav-btn-primary">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-btn-ghost">Login</Link>
                <Link to="/register" className="nav-btn-primary">Get Started <FiArrowRight size={14} /></Link>
              </>
            )}
          </div>
          <button className="nav-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <a href="#features"     onClick={() => setMenuOpen(false)} className="mobile-link">Features</a>
            <a href="#stats"        onClick={() => setMenuOpen(false)} className="mobile-link">Impact</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)} className="mobile-link">Stories</a>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="mobile-link">Dashboard</Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="nav-btn-primary text-center mt-2">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"       onClick={() => setMenuOpen(false)} className="mobile-link">Login</Link>
                <Link to="/register"    onClick={() => setMenuOpen(false)} className="nav-btn-primary text-center mt-2">Get Started</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ═══ HERO CONTAINER (JS Pinned) ═══ */}
      <div className="hero-pin-container">
        <section className="hero-section sticky-hero" ref={heroRef} style={{ opacity: heroOpacity, transform: `scale(${heroScale})` }}>

          {/* ── Video (parallax: drifts slower than scroll) ── */}
          <div
            className="video-wrapper"
            style={{ transform: `translate3d(0, ${videoTranslateY}px, 0) scale(${videoScale})` }}
          >
            <video
              ref={videoRef}
              className="hero-video"
              poster="/hero-poster.png"
              autoPlay muted loop playsInline
            >
              <source src="/hero-agri.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Dynamic Video Overlays — start clear, fade to dark/dull as text appears */}
          <div className="hero-overlay-dark" style={{ opacity: textOpacity }} />
          <div className="hero-overlay-gradient" style={{ opacity: textOpacity }} />
          <div className="hero-overlay-bottom" style={{ opacity: textOpacity }} />

          {/* Ambient glow orbs */}
          <div className="orb orb-1" style={{ transform: `translate3d(0, ${-mobileProgress * 150}px, 0)` }} />
          <div className="orb orb-2" style={{ transform: `translate3d(0, ${-mobileProgress * 100}px, 0)` }} />
          <div className="orb orb-3" />

          {/* ── Floating stat cards (3D Parallax with Sequential Reveal) ── */}
          <div
            className="floating-card"
            style={{
              top: '20%', right: '6%',
              ...card1Style
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mb-3 shadow-lg">
              <FiShield size={17} className="text-white" />
            </div>
            <p className="text-white/50 text-xs mb-1">Crop Protection</p>
            <p className="text-white font-bold text-base">Active ✓</p>
            <p className="text-primary-400 text-xs mt-1 font-medium">All 3 farms covered</p>
          </div>

          <div
            className="floating-card"
            style={{
              top: '42%', right: '4%',
              ...card2Style
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 flex items-center justify-center mb-3 shadow-lg">
              <FiCloud size={17} className="text-white" />
            </div>
            <p className="text-white/50 text-xs mb-1">Weather Alert</p>
            <p className="text-white font-bold text-base">Rain in 3h</p>
            <p className="text-accent-400 text-xs mt-1 font-medium">⚠ Harvest advisory</p>
          </div>

          <div
            className="floating-card"
            style={{
              top: '64%', right: '6%',
              ...card3Style
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center mb-3 shadow-lg">
              <FiTrendingUp size={17} className="text-white" />
            </div>
            <p className="text-white/50 text-xs mb-1">Wheat Price</p>
            <p className="text-white font-bold text-base">₹2,180/q</p>
            <p className="text-primary-400 text-xs mt-1 font-medium">↑ 4.2% today</p>
          </div>

          {/* ── Main hero text content (Reveals in Phase 1) ── */}
          <div className="hero-content-wrapper">
            <div
              className="hero-content"
              style={{
                opacity: textOpacity,
              }}
            >
            <div className="hero-badge">
              <FiZap size={12} className="text-accent-400" />
              <span>AI Crop Intelligence</span>
            </div>

            <h1 className="hero-headline">
              Protect Your Farm
              <br />
              <span className="hero-headline-accent">Grow Your Future</span>
            </h1>

            <p className="hero-subtext">
              Satellite insights, weather AI, and live market data. 
              The ultimate platform to protect your harvest and grow your profits.
            </p>

            <div className="hero-actions">
              {user ? (
                <>
                  <Link to="/dashboard" className="hero-btn-primary">
                    Go to Dashboard <FiArrowRight size={18} />
                  </Link>
                  <button onClick={handleLogout} className="hero-btn-ghost">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/register" className="hero-btn-primary">
                    Start for Free <FiArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="hero-btn-ghost">Sign In</Link>
                </>
              )}
            </div>

            <div className="hero-trust">
              <div className="trust-item"><FiCheckCircle size={13} className="text-primary-400" /><span>Trusted by 12,000+ farmers</span></div>
              <div className="trust-item"><FiCheckCircle size={13} className="text-primary-400" /><span>Free 30-day trial</span></div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="section-wrapper" style={{ scrollSnapAlign: 'start' }}>
        <div className="section-glow section-glow-left" />
        <div className="section-glow section-glow-right" />
        <div className="section-header">
          <span className="section-tag">Powerful Features</span>
          <h2 className="section-title-lg">Everything a Farmer<br /><span className="gradient-text">Needs to Succeed</span></h2>
          <p className="section-subtitle">Cutting-edge technology meets ground-level farm data to deliver actionable insights at every stage of the crop cycle.</p>
        </div>
        <div className="features-grid">
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="how-it-works">
        <div className="section-wrapper">
          <div className="section-header">
            <span className="section-tag">Simplifying Agriculture</span>
            <h2 className="section-title-lg">How AgriShield <span className="gradient-text">Protects You</span></h2>
          </div>
          <div className="hiw-grid">
            <div className="hiw-step">
              <div className="hiw-number">01</div>
              <div className="hiw-icon-box bg-primary-500/10"><FiGlobe size={32} className="text-primary-400" /></div>
              <h3 className="hiw-title">Map Your Farm</h3>
              <p className="hiw-text">Link your land using GPS or satellite imagery. Our AI begins monitoring your specific soil and crop conditions immediately.</p>
            </div>
            <div className="hiw-arrow flex items-center justify-center opacity-20 hidden lg:flex"><FiArrowRight size={30} /></div>
            <div className="hiw-step">
              <div className="hiw-number">02</div>
              <div className="hiw-icon-box bg-ocean-500/10"><FiZap size={32} className="text-ocean-400" /></div>
              <h3 className="hiw-title">Get AI Insights</h3>
              <p className="hiw-text">Receive real-time alerts for pests, weather, and harvest timing. Our ML models predict risks before they become problems.</p>
            </div>
            <div className="hiw-arrow flex items-center justify-center opacity-20 hidden lg:flex"><FiArrowRight size={30} /></div>
            <div className="hiw-step">
              <div className="hiw-number">03</div>
              <div className="hiw-icon-box bg-accent-500/10"><FiShield size={32} className="text-accent-400" /></div>
              <h3 className="hiw-title">Claim with Ease</h3>
              <p className="hiw-text">If loss occurs, AI verifies it via satellite data. Get instant insurance payouts directly to your bank account — no paperwork needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section id="stats" className="stats-section">
        <div className="stats-inner">
          <div className="section-header">
            <span className="section-tag">Our Impact</span>
            <h2 className="section-title-lg">Numbers That <span className="gradient-text">Speak</span></h2>
          </div>
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-box">
                <div className="stat-icon-wrap mb-4 flex justify-center"><s.icon size={22} className="text-primary-400" /></div>
                <div className="stat-value text-white"><AnimatedCounter target={s.value} suffix={s.suffix} prefix={s.prefix || ''} /></div>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="section-wrapper">
        <div className="section-header">
          <span className="section-tag">Farmer Stories</span>
          <h2 className="section-title-lg">Trusted by Farmers<br /><span className="gradient-text">Across India</span></h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t) => <TestimonialCard key={t.name} {...t} />)}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-orb cta-orb-1" />
          <div className="cta-orb cta-orb-2" />
          <div className="relative z-10 text-center">
            <h2 className="cta-headline">Start Protecting Your Farm Today</h2>
            <p className="cta-subtext">Join 12,000+ farmers who trust AgriShield AI to secure their livelihoods.</p>
            <div className="flex gap-4 justify-center flex-wrap mt-8">
              <Link to="/register" className="hero-btn-primary">Create Free Account <FiArrowRight size={18} /></Link>
              <Link to="/login"    className="hero-btn-ghost">Already have an account?</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <div className="logo-icon logo-icon-sm"><FiShield size={16} className="text-white" /></div>
            <span className="logo-text text-base">AgriShield <span className="text-primary-400">AI</span></span>
          </div>
          <p className="footer-copy">© 2025 AgriShield AI · Built for Bharat's farmers</p>
          <div className="footer-links">
            <a href="#features"  className="footer-link">Features</a>
            <a href="#stats"     className="footer-link">Impact</a>
            {user ? (
              <>
                <Link to="/dashboard" className="footer-link">Dashboard</Link>
                <button onClick={handleLogout} className="footer-link">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="footer-link">Login</Link>
                <Link to="/register" className="footer-link">Register</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
