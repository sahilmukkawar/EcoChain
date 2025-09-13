import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../contexts/CartContext.tsx';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-green-800 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-white text-2xl font-bold flex items-center gap-2 transition-transform hover:scale-105">
              <span className="text-3xl drop-shadow-lg">🌱</span>
              <span className="bg-gradient-to-r from-green-400 to-yellow-300 text-transparent bg-clip-text">EcoChain</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                onClick={handleLinkClick}
                className={`text-white no-underline font-medium px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  location.pathname === item.to 
                    ? 'bg-green-500/30 text-green-300 shadow-lg shadow-green-500/40' 
                    : 'hover:bg-green-500/20 hover:text-green-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <div className="user-wallet flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                  <span className="text-lg">🌱</span>
                  <span className="font-semibold text-green-300 text-sm">
                    {user?.ecoWallet?.currentBalance || 0} EcoTokens
                  </span>
                </div>
                
                <Link to="/cart" className="relative text-white text-xl no-underline p-2 rounded-full bg-white/10 transition-all hover:bg-green-500/20 hover:scale-110" title="Shopping Cart">
                  <span role="img" aria-label="Shopping Cart">🛒</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {cart.length > 99 ? '99+' : cart.length}
                    </span>
                  )}
                </Link>
              </div>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="user-profile flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <div className="user-details flex flex-col items-start">
                    <span className="font-semibold text-sm">{user?.name}</span>
                    <span className="text-xs text-green-300 capitalize bg-green-500/20 px-2 py-0.5 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button 
                  className="bg-red-500/20 text-white border border-red-500/30 px-3 py-1.5 rounded-lg cursor-pointer transition-all font-medium hover:bg-red-500/30 hover:text-red-100 text-sm" 
                  onClick={handleLogout} 
                  title="Logout"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons flex gap-2">
                <Link to="/login" className="text-white no-underline px-4 py-2 rounded-lg transition-all font-medium border border-white/30 bg-white/10 hover:bg-white/20 text-sm">
                  Login
                </Link>
                <Link to="/register" className="text-white no-underline px-4 py-2 rounded-lg transition-all font-medium bg-gradient-to-r from-green-500 to-green-600 hover:bg-gradient-to-r hover:from-green-600 hover:to-green-700 text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-green-300 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <span className="text-2xl">✕</span>
              ) : (
                <span className="text-2xl">☰</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-blue-900/95 backdrop-blur-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigationItems.map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                onClick={handleLinkClick}
                className={`text-white no-underline block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 ${
                  location.pathname === item.to 
                    ? 'bg-green-500/30 text-green-300' 
                    : 'hover:bg-green-500/20 hover:text-green-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Auth Section */}
            <div className="pt-4 pb-3 border-t border-gray-700">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center px-3 gap-2 mb-3">
                    <span className="text-xl">👤</span>
                    <div>
                      <div className="text-base font-medium">{user?.name}</div>
                      <div className="text-sm text-green-300 capitalize">{user?.role}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center px-3 gap-2 mb-3">
                    <span className="text-lg">🌱</span>
                    <span className="font-semibold text-green-300">
                      {user?.ecoWallet?.currentBalance || 0} EcoTokens
                    </span>
                  </div>
                  
                  <div className="flex px-3 gap-2">
                    <Link to="/cart" className="relative text-white text-lg no-underline p-2 rounded-full bg-white/10 transition-all hover:bg-green-500/20" title="Shopping Cart">
                      🛒
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                          {cart.length > 9 ? '9+' : cart.length}
                        </span>
                      )}
                    </Link>
                    <button 
                      className="flex-1 bg-red-500/20 text-white border border-red-500/30 px-4 py-2 rounded-lg cursor-pointer transition-all font-medium hover:bg-red-500/30" 
                      onClick={handleLogout}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-3">
                  <Link 
                    to="/login" 
                    onClick={handleLinkClick}
                    className="text-white no-underline px-4 py-2 rounded-lg transition-all font-medium border border-white/30 bg-white/10 hover:bg-white/20 text-center"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={handleLinkClick}
                    className="text-white no-underline px-4 py-2 rounded-lg transition-all font-medium bg-gradient-to-r from-green-500 to-green-600 hover:bg-gradient-to-r hover:from-green-600 hover:to-green-700 text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;