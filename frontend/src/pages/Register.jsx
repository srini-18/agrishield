import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiPhone, FiShield, FiArrowRight, FiCreditCard } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'farmer', govId: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const roles = [
    { value: 'farmer', label: 'Farmer', desc: 'Register farms, monitor crops', icon: '🌾' },
    { value: 'admin', label: 'Administrator', desc: 'Manage platform & users', icon: '⚙️' },
    { value: 'insurer', label: 'Insurance Provider', desc: 'Manage insurance policies', icon: '🛡️' },
    { value: 'bank', label: 'Financial Institution', desc: 'Assess agricultural credit', icon: '🏦' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0f1a] py-12">
      <div className="absolute inset-0">
        <div className="absolute top-10 right-20 w-80 h-80 bg-primary-500/10 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-10 left-20 w-72 h-72 bg-accent-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg mx-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/20">
            <FiShield className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Join AgriShield AI</h1>
          <p className="text-white/40 text-sm">Create your account to get started</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="label-text">Select Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.value })}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                      formData.role === role.value
                        ? 'bg-primary-500/15 border-primary-500/30 text-white'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-lg mb-0.5">{role.icon}</div>
                    <div className="text-xs font-medium">{role.label}</div>
                    <div className="text-[10px] opacity-60">{role.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input name="name" value={formData.name} onChange={handleChange} className="input-field pl-10 text-sm" placeholder="Full Name" required />
                </div>
              </div>
              <div>
                <label className="label-text">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input name="phone" value={formData.phone} onChange={handleChange} className="input-field pl-10 text-sm" placeholder="+91 XXXXX" />
                </div>
              </div>
            </div>

            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field pl-10" placeholder="you@example.com" required />
              </div>
            </div>

            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input name="password" type="password" value={formData.password} onChange={handleChange} className="input-field pl-10" placeholder="Min 6 characters" required />
              </div>
            </div>

            <div>
              <label className="label-text">Government ID (Aadhaar / National ID)</label>
              <div className="relative">
                <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input name="govId" value={formData.govId} onChange={handleChange} className="input-field pl-10" placeholder="Optional" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Create Account <FiArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
