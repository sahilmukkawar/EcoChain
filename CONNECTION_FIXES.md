# Connection Fixes for Production Deployment

This document explains the changes made to fix the connection issues between the frontend (deployed on Vercel) and backend (deployed on Render).

## Issues Identified

1. **WebSocket URL Construction**: The WebSocket service was not properly handling URL construction for production environments, especially when deployed on Vercel.
2. **CORS Configuration**: The backend was not configured to accept requests from Vercel domains.
3. **Content Security Policy**: The CSP was not allowing connections from Vercel domains.
4. **Environment Variables**: Missing or incorrect environment variables for API and WebSocket URLs.

## Fixes Implemented

### 1. WebSocket Service Improvements (`client/src/services/websocketService.ts`)

- Added logic to ensure WebSocket URLs use `wss://` in production when the page is served over HTTPS
- Enhanced error logging to provide better debugging information
- Improved URL construction to handle different deployment scenarios

### 2. API Service Improvements (`client/src/services/api.ts`)

- Updated base URL determination to ensure it works correctly in production
- Added detailed error logging for API connection issues
- Increased timeout for production stability

### 3. CORS Configuration (`config/security.js`)

- Added `https://*.vercel.app` to allowed origins
- Updated Content Security Policy to allow connections from Vercel domains

### 4. Server Configuration (`server.js`)

- Enhanced WebSocket upgrade handling for better proxy compatibility
- Added more detailed logging for WebSocket connections

### 5. Vercel Configuration (`client/vercel.json`)

- Created configuration file with proper routing and environment variables
- Added proxy routes for API and WebSocket connections

### 6. Deployment Documentation (`README.md`)

- Added detailed instructions for Vercel deployment
- Updated environment variable requirements

## How to Deploy on Vercel

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Set the following configuration:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Add environment variables:
   - `REACT_APP_API_BASE_URL` - Your backend API URL (`https://ecochain-j1nj.onrender.com/api`)
   - `REACT_APP_WS_URL` - Your WebSocket URL (`wss://ecochain-j1nj.onrender.com`)

Alternatively, use the provided `vercel.json` file which includes these settings.

## Testing Connections

A connection test page has been added at `/connection-test` to help diagnose connection issues. This page will:

1. Test API connectivity
2. Test WebSocket connectivity
3. Display detailed logs and error messages
4. Show current environment configuration

## Troubleshooting

If you still experience connection issues:

1. Verify that environment variables are set correctly in your Vercel project settings
2. Check that the Render backend is running and accessible
3. Review browser console logs for detailed error messages
4. Ensure CORS is properly configured on the backend
5. For WebSocket issues, verify that your hosting provider supports WebSocket upgrades

## Additional Notes

- The fixes ensure that both HTTP/HTTPS and WS/WSS protocols are handled correctly
- The solution works for both Vercel production deployments and preview deployments
- Connection testing utilities have been added to help diagnose issues in development