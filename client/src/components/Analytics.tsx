import React, { useState, useEffect, useCallback } from 'react';
import adminService, { AnalyticsData } from '../services/adminService.ts';

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState('monthly');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAnalyticsData({ period: timePeriod as any });
      setAnalyticsData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 403) {
          setError('Access Denied: You do not have permission to view analytics data. Only administrators can access this feature.');
        } else {
          setError(`Server Error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('Network Error: Unable to connect to the server');
      } else {
        // Something else happened
        setError(`Error: ${err.message || 'Failed to fetch analytics data'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (loading) {
    return <div className="p-6">Loading analytics data...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error: {error}</div>
        <button 
          onClick={fetchAnalyticsData}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="p-6">No analytics data available</div>;
  }

  const {
    platformMetrics = { totalRevenue: 0, totalTokensIssued: 0, activeUsers: 0, totalCollectors: 0, totalFactories: 0, totalGarbageCollected: 0 },
    environmentalImpact = { co2Saved: 0, treesEquivalent: 0, energySaved: 0, waterSaved: 0 },
    businessMetrics = { ordersPlaced: 0, averageOrderValue: 0, customerRetentionRate: 0, factorySatisfactionScore: 0 },
    topPerformers = { topUsers: [], topCollectors: [], topFactories: [] },
    wasteTypeDistribution = [],
    collectionTrends = []
  } = analyticsData || {};

  // Render a simple bar chart for trends
  const renderTrendChart = () => {
    if (!collectionTrends || collectionTrends.length === 0) return null;
    
    const maxCollections = Math.max(...collectionTrends.map(t => t.collections || 0), 1);
    
    return (
      <div className="mt-4">
        <div className="flex items-end h-32 gap-2 mt-4 border-b border-l border-gray-300 pb-4 pl-4">
          {collectionTrends && collectionTrends.map((trend, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition-all"
                style={{ height: `${((trend.collections || 0) / maxCollections) * 100}%` }}
              />
              <div className="text-xs mt-2 text-gray-600 truncate w-full text-center">
                {trend.date ? new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown Date'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate percentages for waste type distribution
  const totalWasteWeight = wasteTypeDistribution ? wasteTypeDistribution.reduce((sum, item) => sum + item.weight, 0) : 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="border rounded p-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button 
            onClick={fetchAnalyticsData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Sales and Revenue Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Total Sales and Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border p-4 rounded">
            <h3 className="font-semibold text-lg mb-2">Financial Revenue</h3>
            <p className="text-3xl font-bold text-green-600">₹{(platformMetrics.totalRevenue || 0).toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">Collector payments processed</p>
          </div>
          <div className="border p-4 rounded">
            <h3 className="font-semibold text-lg mb-2">Token Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">{(platformMetrics.totalTokensIssued || 0).toFixed(0)}</p>
            <p className="text-sm text-gray-500 mt-1">EcoTokens issued to users</p>
          </div>
        </div>
      </div>

      {/* User Activity Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">User Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border p-4 rounded">
            <h3 className="font-semibold text-lg mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-blue-600">{platformMetrics.activeUsers || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Users active in last 30 days</p>
          </div>
          <div className="border p-4 rounded">
            <h3 className="font-semibold text-lg mb-2">Order History</h3>
            <p className="text-3xl font-bold text-orange-600">{businessMetrics.ordersPlaced || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total orders placed</p>
          </div>
        </div>
        
        {/* Top Users */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3">Top Performing Users</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Earned</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topPerformers.topUsers && topPerformers.topUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name || 'Unknown User'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.collections || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{(user.tokens || 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Factory Performance Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Factory Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Orders Received</h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500">Total orders</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Orders Completed</h3>
            <p className="text-2xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500">Successfully processed</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Avg Delivery Time</h3>
            <p className="text-2xl font-bold text-purple-600">0 days</p>
            <p className="text-sm text-gray-500">Average turnaround</p>
          </div>
        </div>
        
        {/* Top Factories */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Top Performing Factories</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materials Processed (kg)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topPerformers.topFactories && topPerformers.topFactories.map((factory) => (
                  <tr key={factory._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{factory.name || 'Unknown Factory'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{(factory.materials || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Statistics Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Product Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Most Sold Products</h3>
            <p className="text-lg font-bold text-green-600">Not Available</p>
            <p className="text-sm text-gray-500">Top products</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Least Sold Products</h3>
            <p className="text-lg font-bold text-red-600">Not Available</p>
            <p className="text-sm text-gray-500">Lowest sales</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Stock Levels</h3>
            <p className="text-lg font-bold text-blue-600">Not Available</p>
            <p className="text-sm text-gray-500">Current inventory</p>
          </div>
        </div>
        
        {/* Waste Type Distribution */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Waste Type Distribution</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wasteTypeDistribution && wasteTypeDistribution.map((waste, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{waste.type || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{waste.count || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{(waste.weight || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {totalWasteWeight > 0 ? (((waste.weight || 0) / totalWasteWeight) * 100).toFixed(2) : '0.00'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Tracking Overview */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Order Tracking Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Processing</h3>
            <p className="text-2xl font-bold text-blue-600">24</p>
            <p className="text-sm text-gray-500">Orders in progress</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Shipping</h3>
            <p className="text-2xl font-bold text-yellow-600">18</p>
            <p className="text-sm text-gray-500">Orders in transit</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Delivered</h3>
            <p className="text-2xl font-bold text-green-600">142</p>
            <p className="text-sm text-gray-500">Successfully delivered</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Cancelled</h3>
            <p className="text-2xl font-bold text-red-600">3</p>
            <p className="text-sm text-gray-500">Cancelled orders</p>
          </div>
        </div>
      </div>

      {/* Token Usage Analytics */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Token Usage Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Tokens Redeemed</h3>
            <p className="text-2xl font-bold text-green-600">1,245</p>
            <p className="text-sm text-gray-500">EcoTokens used</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Tokens Saved</h3>
            <p className="text-2xl font-bold text-blue-600">3,876</p>
            <p className="text-sm text-gray-500">In user wallets</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Tokens Converted</h3>
            <p className="text-2xl font-bold text-purple-600">892</p>
            <p className="text-sm text-gray-500">To fiat currency</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Conversion Rate</h3>
            <p className="text-2xl font-bold text-orange-600">23.1%</p>
            <p className="text-sm text-gray-500">Redemption rate</p>
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Environmental Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">CO2 Saved</h3>
            <p className="text-lg font-bold">{(environmentalImpact.co2Saved || 0).toFixed(2)} kg</p>
            <p className="text-sm text-gray-500">Equivalent to {Math.round((environmentalImpact.co2Saved || 0) / 0.5)} trees</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Trees Equivalent</h3>
            <p className="text-lg font-bold">{(environmentalImpact.treesEquivalent || 0).toFixed(2)}</p>
            <p className="text-sm text-gray-500">Trees saved from cutting</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Energy Saved</h3>
            <p className="text-lg font-bold">{(environmentalImpact.energySaved || 0).toFixed(2)} kWh</p>
            <p className="text-sm text-gray-500">Electricity conserved</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Water Saved</h3>
            <p className="text-lg font-bold">{(environmentalImpact.waterSaved || 0).toFixed(2)} L</p>
            <p className="text-sm text-gray-500">Water conserved</p>
          </div>
        </div>
      </div>

      {/* Collection Trends */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Collection Trends</h2>
        {renderTrendChart()}
        <div className="mt-4 text-sm text-gray-600">
          Collections over the last 7 days
        </div>
      </div>

      {/* Trends and Reports */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Trends and Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Daily Growth</h3>
            <p className="text-2xl font-bold text-green-600">+5.2%</p>
            <p className="text-sm text-gray-500">Compared to yesterday</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Weekly Growth</h3>
            <p className="text-2xl font-bold text-green-600">+12.5%</p>
            <p className="text-sm text-gray-500">Compared to last week</p>
          </div>
          <div className="border p-4 rounded text-center">
            <h3 className="font-semibold">Monthly Growth</h3>
            <p className="text-2xl font-bold text-green-600">+32.7%</p>
            <p className="text-sm text-gray-500">Compared to last month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;