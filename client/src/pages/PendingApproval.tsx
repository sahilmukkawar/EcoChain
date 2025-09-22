import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf } from 'lucide-react';

const PendingApproval: React.FC = () => {
  const { user } = useAuth();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time to show how long the user has been waiting
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="text-center">
          <div className="mx-auto bg-yellow-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <Leaf className="w-12 h-12 text-yellow-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h1>
          <p className="text-gray-600 mb-6">
            Your {user?.role} account is currently pending admin approval. 
            You will receive an email notification once your account has been approved.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <span className="font-medium">Note:</span> This process may take up to 24-48 hours. 
              If you have any questions, please contact our support team.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm">
              <span className="font-medium">Waiting time:</span> {formatTime(elapsedTime)}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, (elapsedTime / 300) * 100)}%` }} // Progress bar that fills over 5 minutes
              ></div>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Please keep this page open while waiting for approval
            </p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-green-500 to-teal-400 hover:from-green-600 hover:to-teal-500 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow transition-all duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;