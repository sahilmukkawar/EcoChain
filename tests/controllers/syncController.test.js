// tests/controllers/syncController.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const syncController = require('../../controllers/syncController');
const User = require('../../database/models/User');

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Mock request and response
const mockRequest = (params = {}, query = {}, body = {}, user = {}) => ({
  params,
  query,
  body,
  user
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Sync Controller', () => {
  let mongoServer;
  
  // Set up MongoDB Memory Server before tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });
  
  // Clean up after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // Clear database between tests
  beforeEach(async () => {
    await User.deleteMany({});
  });
  
  describe('getLatestData', () => {
    it('should return 400 for invalid entity type', async () => {
      const req = mockRequest({ entityType: 'invalid' });
      const res = mockResponse();
      const next = jest.fn();
      
      await syncController.getLatestData(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('Invalid entity type')
      });
    });
    
    it('should return updated records since timestamp', async () => {
      // Create test user
      const testUser = new User({
        userId: 'test123',
        personalInfo: {
          name: 'Test User',
          email: 'test@example.com'
        },
        password: 'password123'
      });
      await testUser.save();
      
      const timestamp = Date.now() - 3600000; // 1 hour ago
      const req = mockRequest(
        { entityType: 'users' },
        { lastSyncTimestamp: timestamp }
      );
      const res = mockResponse();
      const next = jest.fn();
      
      await syncController.getLatestData(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([expect.objectContaining({
          userId: 'test123'
        })]),
        syncTimestamp: expect.any(Number)
      });
    });
  });
  
  describe('pushUpdates', () => {
    it('should return 400 for invalid entity type', async () => {
      const req = mockRequest(
        { entityType: 'invalid' },
        {},
        { updates: [] }
      );
      const res = mockResponse();
      const next = jest.fn();
      
      await syncController.pushUpdates(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('Invalid entity type')
      });
    });
    
    it('should return 400 for invalid updates array', async () => {
      const req = mockRequest(
        { entityType: 'users' },
        {},
        { updates: 'not-an-array' }
      );
      const res = mockResponse();
      const next = jest.fn();
      
      await syncController.pushUpdates(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('Updates must be a non-empty array')
      });
    });
    
    it('should process create operations', async () => {
      const req = mockRequest(
        { entityType: 'users' },
        {},
        { 
          updates: [{
            operation: 'create',
            data: {
              userId: 'new123',
              personalInfo: {
                name: 'New User',
                email: 'new@example.com'
              },
              password: 'password123'
            }
          }]
        }
      );
      const res = mockResponse();
      const next = jest.fn();
      
      await syncController.pushUpdates(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        results: expect.arrayContaining([expect.objectContaining({
          success: true
        })]),
        syncTimestamp: expect.any(Number)
      });
      
      // Verify user was created
      const user = await User.findOne({ userId: 'new123' });
      expect(user).toBeTruthy();
      expect(user.personalInfo.name).toBe('New User');
    });
  });
  
  describe('getSyncStatus', () => {
    it('should return sync status with collection counts', async () => {
      // Create test user
      const testUser = new User({
        userId: 'test123',
        personalInfo: {
          name: 'Test User',
          email: 'test@example.com'
        },
        password: 'password123'
      });
      await testUser.save();
      
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();
      
      await syncController.getSyncStatus(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        status: 'online',
        lastServerSync: expect.any(Number),
        statistics: expect.objectContaining({
          users: 1
        })
      });
    });
  });
});