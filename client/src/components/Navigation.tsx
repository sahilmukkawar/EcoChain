import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Role-based navigation items
  const getNavigationItems = () => {
    const commonItems = [
      { to: '/marketplace', label: 'Marketplace', icon: '🛒' }
    ];

    if (!isAuthenticated) {
      return commonItems;
    }

    const role = user?.role;
    
    switch (role) {
      case 'admin':
        return [
          ...commonItems,
          { to: '/admin-dashboard', label: 'Admin Dashboard', icon: '⚙️' },
          { to: '/analytics', label: 'Analytics', icon: '📊' },
          { to: '/users', label: 'Manage Users', icon: '👥' },
          { to: '/system-config', label: 'System Config', icon: '🔧' }
        ];
      
      case 'factory':
        return [
          ...commonItems,
          { to: '/factory-dashboard', label: 'Factory Dashboard', icon: '🏭' },
          { to: '/factory-product-management', label: 'Product Management', icon: '📦' },
          { to: '/materials', label: 'Materials', icon: '📦' },
          { to: '/production', label: 'Production', icon: '⚡' },
          { to: '/orders', label: 'Orders', icon: '📋' }
        ];
      
      case 'collector':
        return [
          { to: '/collector-dashboard', label: 'Collector Dashboard', icon: '🚛' },
          { to: '/collections', label: 'Collections', icon: '📍' },
          { to: '/routes', label: 'Routes', icon: '🗺️' },
          { to: '/earnings', label: 'Earnings', icon: '💰' }
        ];
      
      case 'user':
      default:
        return [
          ...commonItems,
          { to: '/dashboard', label: 'Dashboard', icon: '📊' },
          { to: '/waste-submission', label: 'Submit Waste', icon: '♻️' },
          { to: '/wallet', label: 'Wallet', icon: '💳' },
          { to: '/achievements', label: 'Achievements', icon: '🏆' }
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-gradient-to-br from-blue-900 to-blue-500 text-white py-3 shadow-lg sticky top-0 z-100 backdrop-blur-sm">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-4">
        <div className="nav-logo">
          <Link to="/" className="text-white text-2xl font-bold flex items-center gap-2 transition-transform hover:scale-105">
            <span className="text-3xl drop-shadow-lg">🌱</span>
            <span className="bg-gradient-to-r from-green-400 to-green-500 text-transparent bg-clip-text">EcoChain</span>
          </Link>
        </div>
        
        <div className="nav-links flex flex-wrap gap-2">
          {navigationItems.map((item) => (
            <Link 
              key={item.to}
              to={item.to} 
              className={`text-white no-underline font-medium px-4 py-2 rounded-lg relative flex items-center gap-2 transition-all bg-white/10 backdrop-blur-sm ${
                location.pathname === item.to 
                  ? 'bg-green-500/30 text-green-400 shadow-lg shadow-green-500/40' 
                  : 'hover:bg-green-500/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-green-500/30'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="nav-auth flex items-center gap-4">
          {isAuthenticated && (
            <div className="user-wallet flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-2xl border border-green-500/30">
              <span className="text-xl">🌱</span>
              <span className="font-semibold text-green-400">
                {user?.ecoWallet?.currentBalance || 0} EcoTokens
              </span>
            </div>
          )}
          
          <Link to="/checkout" className="text-white text-2xl no-underline p-2 rounded-full bg-white/10 transition-all hover:bg-green-500/20 hover:scale-110" title="Shopping Cart">
            <span role="img" aria-label="Shopping Cart">🛒</span>
          </Link>
          
          {isAuthenticated ? (
            <div className="user-info flex items-center gap-4">
              <div className="user-profile flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl">
                <span className="text-2xl">👤</span>
                <div className="user-details flex flex-col items-start">
                  <span className="font-semibold text-sm">{user?.name}</span>
                  <span className="text-xs text-green-400 capitalize bg-green-500/20 px-2 py-0.5 rounded-lg">
                    {user?.role}
                  </span>
                </div>
              </div>
              <button 
                className="bg-red-500/20 text-white border border-red-500/30 px-4 py-2 rounded-lg cursor-pointer transition-all font-medium hover:bg-red-500/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-red-500/30" 
                onClick={handleLogout} 
                title="Logout"
              >
                🚪 Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons flex gap-3">
              <Link to="/login" className="text-white no-underline px-4 py-2 rounded-lg transition-all font-medium border border-white/30 bg-white/10 hover:bg-white/20 hover:-translate-y-0.5">
                Login
              </Link>
              <Link to="/register" className="text-white no-underline px-4 py-2 rounded-lg transition-all font-medium bg-gradient-to-r from-green-500 to-green-600 hover:bg-gradient-to-r hover:from-green-600 hover:to-green-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/40">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .nav-links {
            gap: 1rem;
          }
          
          .nav-link span:last-child {
            display: none;
          }
          
          .nav-link span:first-child {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 1rem;
            padding: 0.5rem 1rem;
          }
          
          .nav-links {
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .nav-link {
            flex: 1;
            min-width: calc(50% - 0.25rem);
            justify-content: center;
          }
          
          .nav-auth {
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .user-profile {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .nav-link {
            min-width: 100%;
            margin-bottom: 0.25rem;
          }
          
          .nav-label {
            display: block;
            font-size: 0.8rem;
          }
          
          .user-details {
            align-items: center;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;