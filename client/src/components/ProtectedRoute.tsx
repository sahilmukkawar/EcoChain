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
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        <div className="flex flex-col items-center p-6 rounded-xl bg-white shadow-lg border border-gray-100">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-green-100 flex items-center justify-center animate-pulse">
              <span className="text-3xl">🌱</span>
            </div>
            <div className="absolute inset-0 rounded-full border-t-4 border-green-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-green-800 font-medium">Loading...</p>
        </div>
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

