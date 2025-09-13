import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SyncStatus from './SyncStatus';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  
  // Track scroll position for header shadow effect
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-white text-green-800 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex-shrink-0">
          <Link to="/" className="text-green-600 text-2xl font-bold flex items-center gap-2 transition-transform hover:scale-105">
            <span className="text-3xl drop-shadow-sm">🌱</span>
            <span className="bg-gradient-to-r from-green-500 to-blue-400 text-transparent bg-clip-text">EcoChain</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <Link 
            to="/" 
            className={`group relative text-green-700 no-underline font-medium px-2 py-1 flex items-center gap-1 transition-all ${location.pathname === '/' ? 'text-green-600' : ''}`}
          >
            <span className="text-sm">Home</span>
            <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300 ${location.pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
          </Link>
          {isAuthenticated && (
            <>
              <Link 
                to="/dashboard" 
                className={`group relative text-green-700 no-underline font-medium px-2 py-1 flex items-center gap-1 transition-all ${location.pathname === '/dashboard' ? 'text-green-600' : ''}`}
              >
                <span className="text-sm">Dashboard</span>
                <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300 ${location.pathname === '/dashboard' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
              <Link 
                to="/marketplace" 
                className={`group relative text-green-700 no-underline font-medium px-2 py-1 flex items-center gap-1 transition-all ${location.pathname === '/marketplace' ? 'text-green-600' : ''}`}
              >
                <span className="text-sm">Marketplace</span>
                <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300 ${location.pathname === '/marketplace' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <div className="sync-indicator-container hidden md:block">
              <SyncStatus compact={true} showControls={false} />
            </div>
          )}
          <div className="auth-buttons flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="user-profile hidden md:flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <div className="user-details flex flex-col items-start">
                    <span className="font-semibold text-sm text-green-800">{user?.name}</span>
                    <span className="text-xs text-green-700 capitalize bg-green-100 px-2 py-0.5 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button 
                  className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg cursor-pointer transition-all font-medium hover:bg-green-100 text-sm" 
                  onClick={logout}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-green-700 no-underline px-4 py-2 rounded-lg transition-all font-medium border border-green-200 bg-white hover:bg-green-50 text-sm">
                  Login
                </Link>
                <Link to="/register" className="text-white no-underline px-4 py-2 rounded-lg transition-all font-medium bg-gradient-to-r from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 text-sm shadow-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;