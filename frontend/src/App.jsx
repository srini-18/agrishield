import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import FarmDetail from './pages/FarmDetail';
import AddFarm from './pages/AddFarm';
import Satellite from './pages/Satellite';
import Weather from './pages/Weather';
import Predictions from './pages/Predictions';
import Insurance from './pages/Insurance';
import AdminDashboard from './pages/AdminDashboard';
import GovtSchemes from './pages/GovtSchemes';
import Alerts from './pages/Alerts';
import InsurerPolicies from './pages/InsurerPolicies';
import MarketPrices from './pages/MarketPrices';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" />;
  
  return children;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(10, 15, 26, 0.95)',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } />
            <Route path="/farms" element={
              <ProtectedRoute><Layout><Farms /></Layout></ProtectedRoute>
            } />
            <Route path="/farms/add" element={
              <ProtectedRoute><Layout><AddFarm /></Layout></ProtectedRoute>
            } />
            <Route path="/farms/:id" element={
              <ProtectedRoute><Layout><FarmDetail /></Layout></ProtectedRoute>
            } />
            <Route path="/satellite" element={
              <ProtectedRoute><Layout><Satellite /></Layout></ProtectedRoute>
            } />
            <Route path="/weather" element={
              <ProtectedRoute><Layout><Weather /></Layout></ProtectedRoute>
            } />
            <Route path="/predictions" element={
              <ProtectedRoute><Layout><Predictions /></Layout></ProtectedRoute>
            } />
            <Route path="/insurance" element={
              <ProtectedRoute><Layout><Insurance /></Layout></ProtectedRoute>
            } />
            <Route path="/insurer/policies" element={
              <ProtectedRoute roles={['admin', 'insurer']}><Layout><InsurerPolicies /></Layout></ProtectedRoute>
            } />
            <Route path="/schemes" element={
              <ProtectedRoute><Layout><GovtSchemes /></Layout></ProtectedRoute>
            } />
            <Route path="/alerts" element={
              <ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>
            } />
            <Route path="/market" element={
              <ProtectedRoute><Layout><MarketPrices /></Layout></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
