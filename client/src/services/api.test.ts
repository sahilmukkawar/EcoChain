import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api, { 
  authAPI, 
  collectionsAPI, 
  marketplaceAPI, 
  walletAPI, 
  routeAPI, 
  factoryAPI, 
  gamificationAPI, 
  notificationAPI 
} from './api';

// Create a mock for the axios instance
const mock = new MockAdapter(axios);

describe('API Services', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mock.reset();
  });

  // Auth API Tests
  describe('Auth API', () => {
    it('should register a new user', async () => {
      const userData = { 
        email: 'test@example.com', 
        password: 'password123', 
        name: 'Test User' 
      };
      
      mock.onPost('/auth/register').reply(201, { 
        user: { id: '123', email: userData.email, name: userData.name },
        token: 'test-token'
      });
      
      const response = await authAPI.register(userData);
      
      expect(response.status).toBe(201);
      expect(response.data.user.email).toBe(userData.email);
      expect(response.data.token).toBeDefined();
    });

    it('should login a user', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      
      mock.onPost('/auth/login').reply(200, { 
        user: { id: '123', email: credentials.email },
        token: 'test-token'
      });
      
      const response = await authAPI.login(credentials);
      
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
    });
  });

  // Collections API Tests
  describe('Collections API', () => {
    it('should create a collection request', async () => {
      const collectionData = {
        location: {
          coordinates: [73.123, 19.456],
          address: '123 Test Street'
        },
        scheduledTime: new Date().toISOString(),
        wasteTypes: ['plastic', 'paper'],
        quantity: 5,
        notes: 'Test collection'
      };
      
      mock.onPost('/collections/request').reply(201, {
        id: '456',
        status: 'pending',
        ...collectionData
      });
      
      const response = await collectionsAPI.createRequest(collectionData);
      
      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.status).toBe('pending');
    });

    it('should get user collections', async () => {
      mock.onGet('/collections/user').reply(200, [
        { id: '1', status: 'completed' },
        { id: '2', status: 'pending' }
      ]);
      
      const response = await collectionsAPI.getUserCollections();
      
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });
  });

  // Marketplace API Tests
  describe('Marketplace API', () => {
    it('should get products', async () => {
      mock.onGet('/marketplace/products').reply(200, [
        { id: '1', name: 'Recycled Notebook' },
        { id: '2', name: 'Eco-friendly Bag' }
      ]);
      
      const response = await marketplaceAPI.getProducts();
      
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });

    it('should create an order', async () => {
      const orderData = {
        items: [{ productId: '1', quantity: 2 }],
        payment: { method: 'token' as const },
        shipping: {
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          method: 'standard'
        }
      };
      
      mock.onPost('/orders').reply(201, {
        id: '789',
        status: 'pending',
        ...orderData
      });
      
      const response = await marketplaceAPI.createOrder(orderData);
      
      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
    });
  });

  // Wallet API Tests
  describe('Wallet API', () => {
    it('should get wallet balance', async () => {
      mock.onGet('/wallet/balance').reply(200, {
        balance: 500,
        pendingBalance: 50
      });
      
      const response = await walletAPI.getBalance();
      
      expect(response.status).toBe(200);
      expect(response.data.balance).toBeDefined();
    });

    it('should get transaction history', async () => {
      mock.onGet('/wallet/transactions').reply(200, [
        { id: '1', type: 'reward', amount: 100 },
        { id: '2', type: 'purchase', amount: -50 }
      ]);
      
      const response = await walletAPI.getTransactions();
      
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });
  });

  // Route API Tests
  describe('Route API', () => {
    it('should generate an optimized route', async () => {
      const routeData = {
        collectorId: '123',
        date: new Date().toISOString().split('T')[0],
        startLocation: {
          coordinates: [73.123, 19.456]
        },
        points: [
          {
            collectionId: '1',
            location: { coordinates: [73.124, 19.457] }
          },
          {
            collectionId: '2',
            location: { coordinates: [73.125, 19.458] }
          }
        ]
      };
      
      mock.onPost('/routes/optimize').reply(200, {
        id: '123',
        optimizedPoints: [
          { collectionId: '2', order: 1 },
          { collectionId: '1', order: 2 }
        ],
        totalDistance: 5.2,
        estimatedTime: 25
      });
      
      const response = await routeAPI.generateRoute(routeData);
      
      expect(response.status).toBe(200);
      expect(response.data.optimizedPoints).toBeDefined();
    });
  });

  // Factory API Tests
  describe('Factory API', () => {
    it('should get materials', async () => {
      mock.onGet('/factory/materials').reply(200, [
        { id: '1', type: 'plastic', quantity: 500 },
        { id: '2', type: 'paper', quantity: 300 }
      ]);
      
      const response = await factoryAPI.getMaterials();
      
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });

    it('should create a production batch', async () => {
      const batchData = {
        productId: '1',
        quantity: 100,
        materials: [
          { materialId: '1', quantity: 50 },
          { materialId: '2', quantity: 30 }
        ],
        startDate: new Date().toISOString(),
        status: 'planned' as const
      };
      
      mock.onPost('/factory/production').reply(201, {
        id: '123',
        ...batchData
      });
      
      const response = await factoryAPI.createProductionBatch(batchData);
      
      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
    });
  });

  // Gamification API Tests
  describe('Gamification API', () => {
    it('should get user achievements', async () => {
      mock.onGet('/gamification/achievements/user').reply(200, [
        { id: '1', title: 'First Collection', completed: true },
        { id: '2', title: 'Recycling Champion', completed: false }
      ]);
      
      const response = await gamificationAPI.getUserAchievements();
      
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });

    it('should get active challenges', async () => {
      mock.onGet('/gamification/challenges/active').reply(200, [
        { id: '1', title: 'Weekly Recycling Challenge' },
        { id: '2', title: 'Community Cleanup' }
      ]);
      
      const response = await gamificationAPI.getActiveChallenges();
      
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });
  });

  // Notification API Tests
  describe('Notification API', () => {
    it('should get user notifications', async () => {
      mock.onGet('/notifications').reply(200, [
        { id: '1', type: 'collection', title: 'Collection Scheduled', read: false },
        { id: '2', type: 'achievement', title: 'Achievement Unlocked', read: true }
      ]);
      
      const response = await notificationAPI.getNotifications();
      
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });

    it('should mark notification as read', async () => {
      mock.onPut('/notifications/1/read').reply(200, {
        id: '1',
        read: true
      });
      
      const response = await notificationAPI.markAsRead('1');
      
      expect(response.status).toBe(200);
      expect(response.data.read).toBe(true);
    });
  });
});