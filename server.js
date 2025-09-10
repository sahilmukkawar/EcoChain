// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const connectDB = require('./database/connection');
const { repairSeededPasswords } = require('./database/utils');
const logger = require('./utils/logger');
const websocket = require('./utils/websocket');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001; // Using port 3001 to avoid conflicts

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
connectDB().then(async () => {
  try {
    await repairSeededPasswords();
    logger.info('Seeded user passwords verified/repaired on startup');
  } catch (e) {
    logger.warn(`Password repair skipped on startup: ${e.message}`);
  }
}).catch(err => {
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
app.use('/api', apiRoutes);

// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Error handling middleware (must be after all routes)
app.use(notFound);
app.use(errorHandler);

// Start the server
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api`);
  
  // Initialize WebSocket server
  websocket.initWebSocket(server);
  logger.info('WebSocket server initialized for real-time synchronization');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  websocket.closeAllConnections();
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed due to app termination');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
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