// client/src/services/syncService.test.ts
import { SyncService } from './syncService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SyncService', () => {
  let syncService: SyncService;
  const mockToken = 'mock-token';
  
  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorageMock.clear();
    jest.clearAllMocks();
    
    // Initialize SyncService with mock token
    syncService = new SyncService();
  });
  
  describe('getLatestData', () => {
    it('should fetch latest data for a given entity type', async () => {
      // Mock response data
      const mockResponse = {
        data: {
          success: true,
          data: [{ id: '1', name: 'Test Item' }],
          syncTimestamp: 1234567890
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      // Set last sync timestamp in localStorage
      localStorageMock.setItem('lastSyncTimestamp_users', '1000000000');
      
      // Call the method
      const result = await syncService.getLatestData('users', mockToken);
      
      // Verify axios was called correctly
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/sync/users',
        expect.objectContaining({
          params: { lastSyncTimestamp: 1000000000 },
          headers: { Authorization: `Bearer ${mockToken}` }
        })
      );
      
      // Verify result
      expect(result).toEqual({
        data: [{ id: '1', name: 'Test Item' }],
        timestamp: 1234567890
      });
      
      // Verify timestamp was updated in localStorage
      expect(localStorageMock.getItem('lastSyncTimestamp_users')).toBe('1234567890');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock error response
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      // Call the method and expect it to throw
      await expect(syncService.getLatestData('users', mockToken))
        .rejects.toThrow('Failed to fetch latest data: Network error');
    });
  });
  
  describe('pushUpdates', () => {
    it('should push pending updates to the server', async () => {
      // Mock response data
      const mockResponse = {
        data: {
          success: true,
          results: [{ success: true, id: '1' }],
          syncTimestamp: 1234567890
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      // Set up pending updates in localStorage
      const pendingUpdates = [
        { operation: 'create', data: { name: 'New Item' } }
      ];
      localStorageMock.setItem('pendingUpdates_users', JSON.stringify(pendingUpdates));
      
      // Call the method
      const result = await syncService.pushUpdates('users', mockToken);
      
      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/sync/users',
        { updates: pendingUpdates },
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` }
        })
      );
      
      // Verify result
      expect(result).toEqual({
        results: [{ success: true, id: '1' }],
        timestamp: 1234567890
      });
      
      // Verify pending updates were cleared
      expect(localStorageMock.getItem('pendingUpdates_users')).toBe('[]');
    });
    
    it('should handle no pending updates', async () => {
      // Call the method with no pending updates
      const result = await syncService.pushUpdates('users', mockToken);
      
      // Verify axios was not called
      expect(mockedAxios.post).not.toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        results: [],
        timestamp: null
      });
    });
  });
  
  describe('performSync', () => {
    it('should perform a full sync cycle', async () => {
      // Mock responses
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          results: [{ success: true, id: '1' }],
          syncTimestamp: 1234567890
        }
      });
      
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [{ id: '2', name: 'Updated Item' }],
          syncTimestamp: 1234567891
        }
      });
      
      // Set up pending updates
      const pendingUpdates = [
        { operation: 'create', data: { name: 'New Item' } }
      ];
      localStorageMock.setItem('pendingUpdates_users', JSON.stringify(pendingUpdates));
      
      // Call performSync
      const result = await syncService.performSync({
        entityTypes: ['users'],
        token: mockToken
      });
      
      // Verify both methods were called
      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        success: true,
        updates: {
          users: {
            pushed: [{ success: true, id: '1' }],
            received: [{ id: '2', name: 'Updated Item' }]
          }
        },
        timestamp: 1234567891
      });
    });
  });
  
  describe('queueUpdate', () => {
    it('should add an update to the pending queue', () => {
      // Call queueUpdate
      syncService.queueUpdate('users', 'create', { name: 'New Item' });
      
      // Verify update was added to localStorage
      const pendingUpdates = JSON.parse(localStorageMock.getItem('pendingUpdates_users') || '[]');
      expect(pendingUpdates).toEqual([
        { operation: 'create', data: { name: 'New Item' } }
      ]);
    });
    
    it('should append to existing updates', () => {
      // Set up existing updates
      localStorageMock.setItem('pendingUpdates_users', JSON.stringify([
        { operation: 'update', data: { id: '1', name: 'Updated Item' } }
      ]));
      
      // Call queueUpdate
      syncService.queueUpdate('users', 'create', { name: 'New Item' });
      
      // Verify update was appended
      const pendingUpdates = JSON.parse(localStorageMock.getItem('pendingUpdates_users') || '[]');
      expect(pendingUpdates).toEqual([
        { operation: 'update', data: { id: '1', name: 'Updated Item' } },
        { operation: 'create', data: { name: 'New Item' } }
      ]);
    });
  });
});