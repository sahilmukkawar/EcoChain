import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import SyncStatus from './SyncStatus.tsx';
import './SyncStatus.css';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="App-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">EcoChain</Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            {isAuthenticated && (
              <>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/marketplace">Marketplace</Link></li>
                <li><Link to="/wallet">Wallet</Link></li>
                <li><Link to="/achievements">Achievements</Link></li>
                <li><Link to="/factory">Factory</Link></li>
                <li><Link to="/collector">Collector</Link></li>
                <li><Link to="/admin">Admin</Link></li>
              </>
            )}
          </ul>
        </nav>
        <div className="header-right">
          {isAuthenticated && (
            <div className="sync-indicator-container">
              <SyncStatus compact={true} showControls={false} />
            </div>
          )}
          <div className="auth-buttons">
            {isAuthenticated ? (
              <>
                <span className="user-greeting">Hello, {user?.name}</span>
                <button className="logout-button" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="login-button" to="/login">Login</Link>
                <Link className="signup-button" to="/signup">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;