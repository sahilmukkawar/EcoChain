import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, useCart } from '../mockHooks.tsx';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">EcoChain</Link>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/marketplace" 
            className={location.pathname === '/marketplace' ? 'active' : ''}
          >
            Marketplace
          </Link>
          
          <Link 
            to="/waste-submission" 
            className={location.pathname === '/waste-submission' ? 'active' : ''}
          >
            Submit Waste
          </Link>
          
          {user && (
            <Link 
              to="/dashboard" 
              className={location.pathname === '/dashboard' ? 'active' : ''}
            >
              Dashboard
            </Link>
          )}
        </div>
        
        <div className="nav-auth">
          <Link to="/checkout" className="cart-icon">
            <span role="img" aria-label="Shopping Cart">🛒</span>
            {cart && cart.length > 0 && (
              <span className="cart-count">{cart.length}</span>
            )}
          </Link>
          
          {user ? (
            <div className="user-info">
              <div className="token-balance">
                <span className="token-icon">🌱</span>
                <span>{user.ecoTokens || 0} EcoTokens</span>
              </div>
              <button className="logout-btn" onClick={logout}>Logout</button>
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