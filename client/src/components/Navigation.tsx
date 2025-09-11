import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import './Navigation.css';

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
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">
            <span className="logo-icon">🌱</span>
            <span className="logo-text">EcoChain</span>
          </Link>
        </div>
        
        <div className="nav-links">
          {navigationItems.map((item) => (
            <Link 
              key={item.to}
              to={item.to} 
              className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="nav-auth">
          {isAuthenticated && (
            <div className="user-wallet">
              <span className="token-icon">🌱</span>
              <span className="token-balance">
                {user?.ecoWallet?.currentBalance || 0} EcoTokens
              </span>
            </div>
          )}
          
          <Link to="/checkout" className="cart-icon" title="Shopping Cart">
            <span role="img" aria-label="Shopping Cart">🛒</span>
          </Link>
          
          {isAuthenticated ? (
            <div className="user-info">
              <div className="user-profile">
                <span className="user-avatar">👤</span>
                <div className="user-details">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">{user?.role}</span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                🚪 Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/register" className="register-btn">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;