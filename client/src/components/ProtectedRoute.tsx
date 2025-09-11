import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

interface ProtectedRouteProps {
  element: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have required role, redirect to dashboard
  if (allowedRoles.length > 0 && user && !allowedRoles.includes((user as any).role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has required role (or no role required)
  return element;
};

export default ProtectedRoute;

