import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import SyncStatus from './SyncStatus.tsx';
import './SyncStatus.css';
import NavBar from './NavBar.tsx';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="App-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">EcoChain</Link>
        </div>
        <NavBar />
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
                <Link to="/login" className="login-button">Login</Link>
                <Link to="/signup" className="signup-button">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;