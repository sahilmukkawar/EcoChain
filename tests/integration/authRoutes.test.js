// tests/integration/authRoutes.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../../database/models');
const app = require('../../server');

describe('Auth Routes', () => {
  let testUser;
  
  beforeEach(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      personalInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890'
      },
      password: hashedPassword,
      role: 'consumer',
      accountStatus: 'active',
      isVerified: true
    });
  });
  
  describe('POST /auth/login', () => {
    test('should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });
    
    test('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });
    
    test('should return 422 with invalid input format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'short'
        });
      
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('POST /auth/refresh-token', () => {
    let refreshToken;
    
    beforeEach(async () => {
      // Login to get a refresh token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });
    
    test('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
    });
    
    test('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });
  
  describe('POST /auth/register', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'NewPassword123!',
          role: 'consumer'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Verify user was created in database
      const user = await User.findOne({ 'personalInfo.email': 'newuser@example.com' });
      expect(user).toBeDefined();
      expect(user.personalInfo.name).toBe('New User');
      expect(user.role).toBe('consumer');
    });
    
    test('should return 409 if email already exists', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'test@example.com', // Already exists
          password: 'Password123!',
          role: 'consumer'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('EMAIL_EXISTS');
    });
    
    test('should return 422 with invalid input', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'In',
          email: 'invalid-email',
          password: 'short',
          role: 'invalid-role'
        });
      
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});