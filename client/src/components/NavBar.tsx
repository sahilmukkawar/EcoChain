import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../contexts/CartContext';

const NavBar: React.FC = () => {
  const { user } = useAuth();
  const { cart } = useCart();
  const role = user?.role || 'guest';
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const common = [
    { to: '/', label: 'Home' }
  ];

  const byRole: Record<string, { to: string; label: string }[]> = {
    user: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/marketplace', label: 'Marketplace' },
      { to: '/collection-request', label: 'Request Pickup' },
      { to: '/wallet', label: 'Wallet' }
    ],
    collector: [
      { to: '/collector', label: 'Collector Panel' },
      { to: '/collections', label: 'Collections' },
      { to: '/routes', label: 'Routes' },
      { to: '/earnings', label: 'Earnings' }
    ],
    factory: [
      { to: '/factory', label: 'Factory Dashboard' },
      { to: '/materials', label: 'Materials' },
      { to: '/marketplace', label: 'Products' },
      { to: '/orders', label: 'Orders' }
    ],
    admin: [
      { to: '/admin', label: 'Admin' },
      { to: '/users', label: 'Users' },
      { to: '/admin-dashboard/analytics', label: 'Analytics' },
      { to: '/config', label: 'Config' }
    ],
    guest: [
      { to: '/marketplace', label: 'Marketplace' }
    ]
  };

  const links = [...common, ...(byRole[role] || [])];

  return (
    <nav className="navbar">
      <ul className="nav-list">
        {links.map(link => (
          <li key={link.to}>
            <Link className={isActive(link.to)} to={link.to}>{link.label}</Link>
          </li>
        ))}
        {(role === 'user' || role === 'guest') && (
          <li>
            <Link className={isActive('/checkout')} to='/checkout'>
              Cart {cart && cart.length > 0 && `(${cart.length})`}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;


