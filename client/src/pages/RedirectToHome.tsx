import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectToHome: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home page
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to home page...</p>
      </div>
    </div>
  );
};

export default RedirectToHome;