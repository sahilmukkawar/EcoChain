import React, { useState, useEffect } from 'react';
import { testConnections } from '../utils/connectionTest';

const ConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runTest = async () => {
    setIsTesting(true);
    setTestResults(null);
    
    // Override console.log to capture output
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];
    
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog.apply(console, args as any);
    };
    
    console.error = (...args) => {
      logs.push('ERROR: ' + args.join(' '));
      originalError.apply(console, args as any);
    };
    
    try {
      // Run the test
      await testConnections();
      
      setTestResults(logs);
    } catch (error) {
      setTestResults(['Test failed with error: ' + (error as Error).message]);
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      setIsTesting(false);
    }
  };

  useEffect(() => {
    // Auto-run test on page load
    runTest();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Connection Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          <button 
            onClick={runTest}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Run Test'}
          </button>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Environment Information:</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>API Base URL:</strong> {process.env.REACT_APP_API_BASE_URL || 'Not set'}</p>
            <p><strong>WebSocket URL:</strong> {process.env.REACT_APP_WS_URL || 'Not set'}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Test Results:</h3>
          {testResults ? (
            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
              {testResults.map((log, index) => (
                <div 
                  key={index} 
                  className={`font-mono text-sm ${log.includes('ERROR') ? 'text-red-600' : log.includes('✅') ? 'text-green-600' : ''}`}
                >
                  {log}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md">
              {isTesting ? 'Running tests...' : 'Click "Run Test" to start testing connections'}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Ensure environment variables are set correctly in your deployment platform</li>
          <li>Verify that the backend is running and accessible at the specified URLs</li>
          <li>Check browser console for detailed error messages</li>
          <li>Make sure CORS is properly configured on the backend</li>
          <li>For WebSocket issues, ensure the server supports WebSocket upgrades</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionTest;