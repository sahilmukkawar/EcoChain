import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

interface ProtectedRouteProps {
  element: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🌱</div>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have required role, redirect to appropriate dashboard
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Redirect to role-specific dashboard
    const roleDashboards = {
      admin: '/admin-dashboard',
      factory: '/factory-dashboard',
      collector: '/collector-dashboard',
      user: '/dashboard'
    };
    
    const redirectPath = roleDashboards[user.role as keyof typeof roleDashboards] || '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has required role (or no role required)
  return element;
};

export default ProtectedRoute;

