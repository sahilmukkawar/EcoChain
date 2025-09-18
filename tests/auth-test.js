// tests/auth-test.js
// Simple test script to verify auth functionality

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

// Test client
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

console.log('🧪 Starting Auth System Tests...\n');

async function runTests() {
  try {
    // Test 1: Register a regular user
    console.log('1. Testing User Registration...');
    const userRegResponse = await api.post('/auth/register', {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'TestPass123',
      phone: '+1234567890',
      role: 'user',
      address: {
        city: 'Test City',
        state: 'TS'
      }
    });
    
    console.log('✅ User Registration Successful');
    console.log('   Message:', userRegResponse.data.message);
    
    // Test 2: Login as regular user
    console.log('\n2. Testing User Login...');
    const userLoginResponse = await api.post('/auth/login', {
      email: 'testuser@example.com',
      password: 'TestPass123'
    });
    
    console.log('✅ User Login Successful');
    console.log('   User Role:', userLoginResponse.data.data.user.role);
    console.log('   Approval Status:', userLoginResponse.data.data.user.approvalStatus);
    
    // Test 3: Register a factory
    console.log('\n3. Testing Factory Registration...');
    const factoryRegResponse = await api.post('/auth/register', {
      name: 'Test Factory Owner',
      email: 'testfactory@example.com',
      password: 'TestPass123',
      phone: '+1234567891',
      role: 'factory',
      address: {
        city: 'Factory City',
        state: 'FC'
      },
      factoryName: 'Test Eco Factory',
      ownerName: 'Factory Owner',
      gstNumber: 'GST1234567890'
    });
    
    console.log('✅ Factory Registration Successful');
    console.log('   Message:', factoryRegResponse.data.message);
    
    // Test 4: Login as factory (should show pending approval)
    console.log('\n4. Testing Factory Login...');
    const factoryLoginResponse = await api.post('/auth/login', {
      email: 'testfactory@example.com',
      password: 'TestPass123'
    });
    
    console.log('✅ Factory Login Successful');
    console.log('   User Role:', factoryLoginResponse.data.data.user.role);
    console.log('   Approval Status:', factoryLoginResponse.data.data.user.approvalStatus);
    console.log('   Pending Approval:', factoryLoginResponse.data.data.pendingApproval);
    
    // Test 5: Register a collector
    console.log('\n5. Testing Collector Registration...');
    const collectorRegResponse = await api.post('/auth/register', {
      name: 'Test Collector Owner',
      email: 'testcollector@example.com',
      password: 'TestPass123',
      phone: '+1234567892',
      role: 'collector',
      address: {
        city: 'Collector City',
        state: 'CC'
      },
      companyName: 'Test Green Collectors',
      contactName: 'Collector Contact',
      serviceArea: ['Area 1', 'Area 2']
    });
    
    console.log('✅ Collector Registration Successful');
    console.log('   Message:', collectorRegResponse.data.message);
    
    console.log('\n🎉 All Tests Passed!');
    console.log('\n📋 Manual Testing Required:');
    console.log('   1. Login as admin and approve the factory/collector applications');
    console.log('   2. Verify approved factory/collector can access their dashboards');
    console.log('   3. Check email notifications in console logs');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };