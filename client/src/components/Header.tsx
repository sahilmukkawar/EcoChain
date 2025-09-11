import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SyncStatus from './SyncStatus';
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
                <button className="login-button">Login</button>
                <button className="signup-button">Sign Up</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;