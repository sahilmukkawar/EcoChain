// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const connectDB = require('./database/connection');
const logger = require('./utils/logger');

// Provide development defaults for JWT if not set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4002; // Changed from 4001 to 4002 to avoid conflicts

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Security middleware (can be expanded later)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Connect to MongoDB
connectDB().catch(err => {
  logger.error('Failed to connect to database:', err);
  logger.warn('Server will continue running without database connection. Some features may not work properly.');
  // In development mode, we'll continue running even without DB connection
  // process.exit(1);
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to EcoChain API' });
});

// API routes
const apiRoutes = require('./routes');
// Serve static assets under API for dev proxy compatibility
app.use('/api/assets', express.static('public'));
// Serve product images specifically (this should come before general uploads)
app.use('/uploads/product-images', express.static('public/uploads/product-images'));
// Serve uploaded files
app.use('/uploads', express.static('public/uploads'));
app.use('/api', apiRoutes);

// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Error handling middleware (must be after all routes)
app.use(notFound);
app.use(errorHandler);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  try {
    // Extract token from URL query parameters
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }
    
    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Invalid WebSocket authentication attempt', { error: err.message });
        ws.close(1008, 'Invalid token');
        return;
      }
      
      // Store user info in the WebSocket connection
      ws.userId = decoded.id;
      ws.isAuthenticated = true;
      
      logger.info(`WebSocket client connected: ${ws.userId}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to EcoChain sync service',
        timestamp: Date.now()
      }));
    });
  } catch (error) {
    logger.error('WebSocket connection error:', error);
    ws.close(1011, 'Server error');
  }
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      if (!ws.isAuthenticated) {
        return;
      }
      
      const data = JSON.parse(message);
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
          
        case 'subscribe':
          if (Array.isArray(data.entities)) {
            // Store subscriptions for this connection
            ws.subscriptions = data.entities;
            ws.send(JSON.stringify({
              type: 'subscribed',
              entities: data.entities,
              timestamp: Date.now()
            }));
          }
          break;
          
        default:
          logger.warn(`Unknown WebSocket message type: ${data.type}`);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    if (ws.userId) {
      logger.info(`WebSocket client disconnected: ${ws.userId}`);
    }
  });
});

// Function to broadcast updates to subscribed clients
global.broadcastUpdate = (entityType, changeType, changes) => {
  const message = JSON.stringify({
    type: 'sync',
    entityType,
    changeType,
    changes,
    timestamp: Date.now()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && 
        client.isAuthenticated && 
        (!client.subscriptions || client.subscriptions.includes(entityType))) {
      client.send(message);
    }
  });
};

// Start the server
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api`);
  logger.info(`WebSocket server available at ws://localhost:${PORT}/ws`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});