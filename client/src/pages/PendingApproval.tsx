import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import PageTransition from '../components/PageTransition.tsx';

const PendingApproval: React.FC = () => {
  const { user, isAuthenticated, refreshAccessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not authenticated or not a factory/collector, redirect to login
    if (!isAuthenticated || !user || (user.role !== 'factory' && user.role !== 'collector')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const handleRefreshStatus = async () => {
    try {
      await refreshAccessToken();
      // After refresh, if user is approved, redirect to dashboard
      if (user?.approvalStatus === 'approved') {
        if (user.role === 'factory') {
          navigate('/factory-dashboard');
        } else if (user.role === 'collector') {
          navigate('/collector-dashboard');
        }
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-eco-beige flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
          <div className="flex justify-center mb-6">
            {user.approvalStatus === 'pending' ? (
              <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            ) : user.approvalStatus === 'approved' ? (
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {user.approvalStatus === 'pending' 
              ? 'Account Pending Approval' 
              : user.approvalStatus === 'approved' 
                ? 'Account Approved!' 
                : 'Account Rejected'}
          </h1>

          <p className="text-gray-600 mb-6">
            {user.approvalStatus === 'pending' 
              ? `Thank you for registering as a ${user.role}. Your account is currently pending admin approval. You will receive an email notification once your account has been reviewed.`
              : user.approvalStatus === 'approved' 
                ? `Your ${user.role} account has been approved! You can now access your dashboard.`
                : `Unfortunately, your ${user.role} account application has been rejected. ${user.rejectionReason ? `Reason: ${user.rejectionReason}` : 'Please contact support for more information.'}`}
          </p>

          {user.approvalStatus === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>What happens next?</strong> Our admin team will review your application within 1-2 business days. 
                You'll receive an email notification once a decision has been made.
              </p>
            </div>
          )}

          {user.approvalStatus === 'rejected' && user.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                <strong>Rejection Reason:</strong> {user.rejectionReason}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {user.approvalStatus === 'pending' ? (
              <>
                <button
                  onClick={handleRefreshStatus}
                  className="flex items-center justify-center gap-2 w-full bg-eco-green hover:bg-eco-green-dark text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  Check Status
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition"
                >
                  Back to Home
                </button>
              </>
            ) : user.approvalStatus === 'approved' ? (
              <button
                onClick={() => {
                  if (user.role === 'factory') {
                    navigate('/factory-dashboard');
                  } else if (user.role === 'collector') {
                    navigate('/collector-dashboard');
                  }
                }}
                className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-medium py-3 px-4 rounded-lg transition"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  Reapply
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition"
                >
                  Back to Home
                </button>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at support@ecochain.com
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PendingApproval;