import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../utils/auth.ts';

const ProtectedRoute: React.FC<{ children: React.ReactElement; roles?: string[] }> = ({ children, roles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (roles && roles.length > 0) {
    const role = getUserRole();
    if (!role || !roles.includes(role)) {
      // Redirect to a sensible default based on role, or home
      if (role === 'admin') return <Navigate to="/admin" replace />;
      if (role === 'factory') return <Navigate to="/factory" replace />;
      if (role === 'collector') return <Navigate to="/collector" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};

export default ProtectedRoute;

