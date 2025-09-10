// tests/routes/syncRoutes.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const syncRoutes = require('../../routes/syncRoutes');
const auth = require('../../middleware/auth');

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  })
}));

// Mock controller functions
jest.mock('../../controllers/syncController', () => ({
  getLatestData: jest.fn((req, res) => {
    if (req.params.entityType === 'invalid') {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type'
      });
    }
    res.status(200).json({
      success: true,
      data: [{ id: 'test-id', name: 'Test Entity' }],
      syncTimestamp: Date.now()
    });
  }),
  pushUpdates: jest.fn((req, res) => {
    if (req.params.entityType === 'invalid') {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type'
      });
    }
    if (!Array.isArray(req.body.updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be a non-empty array'
      });
    }
    res.status(200).json({
      success: true,
      results: req.body.updates.map(() => ({ success: true })),
      syncTimestamp: Date.now()
    });
  }),
  getSyncStatus: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      status: 'online',
      lastServerSync: Date.now(),
      statistics: {
        users: 10,
        collections: 5,
        marketplace: 20,
        transactions: 15
      }
    });
  })
}));

describe('Sync Routes', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sync', syncRoutes);
  });
  
  describe('GET /api/sync/status', () => {
    it('should return sync status', async () => {
      const response = await request(app).get('/api/sync/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'online');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics).toHaveProperty('users');
    });
  });
  
  describe('GET /api/sync/:entityType', () => {
    it('should return latest data for valid entity type', async () => {
      const response = await request(app).get('/api/sync/users');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('syncTimestamp');
    });
    
    it('should return 400 for invalid entity type', async () => {
      const response = await request(app).get('/api/sync/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid entity type');
    });
    
    it('should use authentication middleware', async () => {
      await request(app).get('/api/sync/users');
      
      expect(auth.authenticateToken).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/sync/:entityType', () => {
    it('should process updates for valid entity type', async () => {
      const updates = [
        { operation: 'create', data: { name: 'New Entity' } }
      ];
      
      const response = await request(app)
        .post('/api/sync/users')
        .send({ updates });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body).toHaveProperty('syncTimestamp');
    });
    
    it('should return 400 for invalid entity type', async () => {
      const updates = [
        { operation: 'create', data: { name: 'New Entity' } }
      ];
      
      const response = await request(app)
        .post('/api/sync/invalid')
        .send({ updates });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid entity type');
    });
    
    it('should return 400 for invalid updates format', async () => {
      const response = await request(app)
        .post('/api/sync/users')
        .send({ updates: 'not-an-array' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Updates must be a non-empty array');
    });
    
    it('should use authentication middleware', async () => {
      const updates = [
        { operation: 'create', data: { name: 'New Entity' } }
      ];
      
      await request(app)
        .post('/api/sync/users')
        .send({ updates });
      
      expect(auth.authenticateToken).toHaveBeenCalled();
    });
  });
});