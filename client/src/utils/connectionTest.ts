// Utility to test WebSocket and API connections
export const testConnections = async () => {
  console.log('Testing connections...');
  
  // Test API connection
  try {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://ecochain-j1nj.onrender.com/api' 
        : '/api');
    
    console.log('API Base URL:', apiBaseUrl);
    
    const response = await fetch(`${apiBaseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ API connection successful');
    } else {
      console.error('❌ API connection failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ API connection error:', error);
  }
  
  // Test WebSocket connection
  try {
    const wsBaseUrl = process.env.REACT_APP_WS_URL || 
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
      window.location.host;
      
    const wsUrl = process.env.NODE_ENV === 'production' && process.env.REACT_APP_WS_URL
      ? process.env.REACT_APP_WS_URL.endsWith('/ws')
        ? process.env.REACT_APP_WS_URL
        : `${process.env.REACT_APP_WS_URL}/ws`
      : `${wsBaseUrl}/ws`;
      
    console.log('WebSocket URL:', wsUrl);
    
    // Only test if we have a token (user is logged in)
    const token = localStorage.getItem('accessToken');
    if (token) {
      const testWsUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;
      console.log('Testing WebSocket connection with URL:', testWsUrl);
      
      // Create a test WebSocket connection
      const ws = new WebSocket(testWsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connection successful');
        ws.close(); // Close after testing
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket connection error:', error);
        console.error('WebSocket URL:', testWsUrl);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket test connection closed:', event.code, event.reason);
      };
      
      // Set a timeout to close the connection if it doesn't open
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('WebSocket connection timeout');
          ws.close();
        }
      }, 5000);
    } else {
      console.log('No auth token available, skipping WebSocket test');
    }
  } catch (error) {
    console.error('❌ WebSocket connection error:', error);
  }
};

export default testConnections;