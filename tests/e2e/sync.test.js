// tests/e2e/sync.test.js
const puppeteer = require('puppeteer');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;
const CLIENT_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User'
};

// Global variables
let browser;
let page;
let mongoServer;
let serverProcess;

// Helper functions
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const startServer = async () => {
  // Start the server in a separate process
  const serverPath = path.join(__dirname, '../../server.js');
  serverProcess = exec(`node ${serverPath}`, {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3001',
      MONGODB_URI: mongoServer.getUri(),
      JWT_SECRET: 'test-secret-key'
    }
  });
  
  // Wait for server to start
  await waitFor(3000);
  
  return serverProcess;
};

const stopServer = async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
};

const registerTestUser = async () => {
  const response = await page.evaluate(async (user, apiUrl) => {
    const res = await fetch(`${apiUrl}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return await res.json();
  }, TEST_USER, API_URL);
  
  return response;
};

const loginTestUser = async () => {
  const response = await page.evaluate(async (user, apiUrl) => {
    const res = await fetch(`${apiUrl}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });
    return await res.json();
  }, TEST_USER, API_URL);
  
  // Store token in localStorage
  if (response.token) {
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, response.token);
  }
  
  return response;
};

describe('End-to-End Sync Tests', () => {
  jest.setTimeout(30000); // Increase timeout for E2E tests
  
  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    // Start server
    await startServer();
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true, // Set to false to see the browser UI
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create new page
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
  });
  
  afterAll(async () => {
    // Close browser
    if (browser) {
      await browser.close();
    }
    
    // Stop server
    await stopServer();
    
    // Close database connection
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  test('User can register, login, and sync data', async () => {
    // Register test user
    const registerResponse = await registerTestUser();
    expect(registerResponse.success).toBe(true);
    
    // Login test user
    const loginResponse = await loginTestUser();
    expect(loginResponse.token).toBeDefined();
    
    // Navigate to dashboard
    await page.goto(`${CLIENT_URL}/dashboard`);
    await page.waitForSelector('.dashboard-container');
    
    // Check if sync status component is visible
    const syncStatusExists = await page.evaluate(() => {
      return document.querySelector('.sync-status') !== null;
    });
    expect(syncStatusExists).toBe(true);
    
    // Click sync button
    await page.click('.sync-button');
    
    // Wait for sync to complete
    await page.waitForFunction(
      () => !document.querySelector('.sync-status').classList.contains('syncing'),
      { timeout: 5000 }
    );
    
    // Verify last sync time is updated
    const lastSyncUpdated = await page.evaluate(() => {
      const lastSyncElement = document.querySelector('.last-sync-time');
      return lastSyncElement && lastSyncElement.textContent.includes('Last synced');
    });
    expect(lastSyncUpdated).toBe(true);
    
    // Create a test update
    const testUpdate = {
      operation: 'create',
      data: {
        name: 'Test Collection',
        description: 'Created during E2E test',
        amount: 100
      }
    };
    
    // Queue update in sync service
    await page.evaluate((update) => {
      const syncService = window.syncService;
      if (syncService) {
        syncService.queueUpdate('collections', update.operation, update.data);
      }
    }, testUpdate);
    
    // Click sync button again to push updates
    await page.click('.sync-button');
    
    // Wait for sync to complete
    await page.waitForFunction(
      () => !document.querySelector('.sync-status').classList.contains('syncing'),
      { timeout: 5000 }
    );
    
    // Verify pending updates count is reset
    const pendingUpdatesCleared = await page.evaluate(() => {
      const pendingElement = document.querySelector('.pending-updates');
      return pendingElement && pendingElement.textContent.includes('0 pending');
    });
    expect(pendingUpdatesCleared).toBe(true);
  });
  
  test('WebSocket connection establishes for real-time updates', async () => {
    // Navigate to dashboard
    await page.goto(`${CLIENT_URL}/dashboard`);
    await page.waitForSelector('.dashboard-container');
    
    // Check if WebSocket connection indicator is visible and connected
    const wsConnected = await page.evaluate(() => {
      // Wait a bit for WebSocket to connect
      return new Promise(resolve => {
        setTimeout(() => {
          const wsStatus = document.querySelector('.websocket-status');
          resolve(wsStatus && wsStatus.classList.contains('connected'));
        }, 2000);
      });
    });
    
    expect(wsConnected).toBe(true);
    
    // Simulate server-side update via WebSocket
    await page.evaluate(() => {
      // Mock receiving a WebSocket message
      const mockEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'sync',
          entityType: 'collections',
          changeType: 'create',
          timestamp: Date.now(),
          changes: [{
            id: 'test-id',
            name: 'WebSocket Test Collection',
            description: 'Created via WebSocket',
            amount: 200
          }]
        })
      });
      
      // Dispatch the event if WebSocket exists
      if (window._websocket) {
        window._websocket.dispatchEvent(mockEvent);
      }
    });
    
    // Wait for sync event to be processed
    await waitFor(1000);
    
    // Verify sync event triggered a refresh
    const syncEventProcessed = await page.evaluate(() => {
      return window._lastSyncEvent && window._lastSyncEvent.type === 'websocket';
    });
    
    expect(syncEventProcessed).toBe(true);
  });
});