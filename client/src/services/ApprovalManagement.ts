//admin approval
import React, { useState, useEffect, useCallback } from 'react';
import adminService, { ApprovalApplication } from '../services/adminService.ts';
import { CheckCircle, XCircle, Clock, FileText, User, Building, Truck } from 'lucide-react';

const ApprovalManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApprovalApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApprovalApplication[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'factory' | 'collector'>('all');
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{[key: string]: string}>({});

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await adminService.getAllApplications({
        status: filter !== 'all' ? filter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      });
      
      if (response.success) {
        setApplications(response.data.applications);
        setFilteredApplications(response.data.applications);
      } else {
        setError('Failed to fetch applications');
      }
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to fetch applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (applicationId: string, type: 'factory' | 'collector') => {
    try {
      if (type === 'factory') {
        await adminService.approveFactoryApplication(applicationId);
      } else {
        await adminService.approveCollectorApplication(applicationId);
      }
      
      // Refresh the list
      fetchApplications();
    } catch (err: any) {
      setError(err.message || 'Failed to approve application');
    }
  };

  const handleReject = async (applicationId: string, type: 'factory' | 'collector') => {
    const reason = rejectReason[applicationId];
    if (!reason || reason.trim() === '') {
      setError('Rejection reason is required');
      return;
    }
    
    try {
      if (type === 'factory') {
        await adminService.rejectFactoryApplication(applicationId, reason);
      } else {
        await adminService.rejectCollectorApplication(applicationId, reason);
      }
      
      // Refresh the list
      fetchApplications();
      
      // Clear the rejection reason
      setRejectReason(prev => {
        const newReasons = { ...prev };
        delete newReasons[applicationId];
        return newReasons;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reject application');
    }
  };

  const handleRejectReasonChange = (applicationId: string, reason: string) => {
    setRejectReason(prev => ({
      ...prev,
      [applicationId]: reason
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'factory':
        return <Building className="h-5 w-5 text-blue-500" />;
      case 'collector':
        return <Truck className="h-5 w-5 text-purple-500" />;
      default:
        return <User className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">User Approval Management</h2>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Types</option>
            <option value="factory">Factory</option>
            <option value="collector">Collector</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="mx-auto text-gray-400" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No applications found</h3>
          <p className="mt-2 text-gray-500">
            {filter === 'pending' 
              ? "There are no pending applications at the moment." 
              : "No applications match your current filters."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.userId.personalInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.userId.personalInfo.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(application.userId.role)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {application.userId.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {application.userId.role === 'factory' ? (
                          <>
                            <div className="font-medium">{application.factoryName}</div>
                            <div className="text-gray-500 text-xs">GST: {application.gstNumber}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">{application.companyName}</div>
                            <div className="text-gray-500 text-xs">
                              {application.serviceArea?.join(', ')}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(application.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      {application.status === 'rejected' && application.rejectionReason && (
                        <div className="text-xs text-gray-500 mt-1">
                          Reason: {application.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {application.status === 'pending' ? (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleApprove(application._id, application.userId.role as 'factory' | 'collector')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Rejection reason"
                              value={rejectReason[application._id] || ''}
                              onChange={(e) => handleRejectReasonChange(application._id, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-xs"
                            />
                            <button
                              onClick={() => handleReject(application._id, application.userId.role as 'factory' | 'collector')}
                              className="mt-1 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : application.status === 'approved' ? (
                        <span className="text-green-600 text-xs font-medium">Approved</span>
                      ) : (
                        <span className="text-red-600 text-xs font-medium">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalManagement;