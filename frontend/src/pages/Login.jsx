import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiShield, FiArrowRight } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
<<<<<<< HEAD
  const [emailError, setEmailError] = useState('');

=======
>>>>>>> 4e717deb4917eae9612607d148e5f85921e138a6
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

<<<<<<< HEAD
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      toast.error('Invalid email format');
      return;
    }

    setEmailError('');
=======
  const handleSubmit = async (e) => {
    e.preventDefault();
>>>>>>> 4e717deb4917eae9612607d148e5f85921e138a6
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0f1a]">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-ocean-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-500/8 rounded-full blur-[80px] animate-float" style={{ animationDelay: '4s' }}></div>
<<<<<<< HEAD

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
=======
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
>>>>>>> 4e717deb4917eae9612607d148e5f85921e138a6
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/20">
            <FiShield className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">AgriShield AI</h1>
          <p className="text-white/40 text-sm">Agricultural Intelligence Platform</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-white/40 text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input
                  type="email"
                  value={email}
<<<<<<< HEAD
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  className={`input-field pl-10 ${emailError ? 'border-red-500/50' : ''}`}
=======
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
>>>>>>> 4e717deb4917eae9612607d148e5f85921e138a6
                  placeholder="farmer@agrishield.ai"
                  required
                />
              </div>
<<<<<<< HEAD
              {emailError && <p className="text-red-400 text-xs mt-1 ml-1">{emailError}</p>}
=======
>>>>>>> 4e717deb4917eae9612607d148e5f85921e138a6
            </div>

            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Sign In <FiArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
