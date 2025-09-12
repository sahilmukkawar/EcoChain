import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SyncStatus from './SyncStatus';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 backdrop-blur-lg bg-blue-900/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="logo">
          <Link to="/" className="text-white text-xl font-bold">EcoChain</Link>
        </div>
        <nav className="main-nav">
          <ul className="flex gap-4 list-none m-0 p-0">
            <li><Link to="/" className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">Home</Link></li>
            {isAuthenticated && (
              <>
                <li><Link to="/dashboard" className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">Dashboard</Link></li>
                <li><Link to="/marketplace" className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">Marketplace</Link></li>
              </>
            )}
          </ul>
        </nav>
        <div className="header-right flex items-center gap-4">
          {isAuthenticated && (
            <div className="sync-indicator-container">
              <SyncStatus compact={true} showControls={false} />
            </div>
          )}
          <div className="auth-buttons flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="text-white">Hello, {user?.name}</span>
                <button 
                  className="bg-gradient-to-br from-red-500 to-amber-500 text-white px-3.5 py-2.5 rounded-lg font-bold cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="bg-gradient-to-br from-green-500 to-amber-500 text-gray-900 border-none px-3.5 py-2.5 rounded-lg font-bold cursor-pointer shadow-lg shadow-green-500/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/40">
                  Login
                </button>
                <button className="bg-gradient-to-br from-amber-500 to-green-500 text-gray-900 px-3.5 py-2.5 rounded-lg font-bold cursor-pointer shadow-lg shadow-amber-500/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;