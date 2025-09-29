// tests/unit/auth.test.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../../database/models');
const { authenticate } = require('../../middleware/auth');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../database/models', () => ({
  User: {
    findById: jest.fn()
  }
}));

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 401 if no token is provided', async () => {
    await authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if token format is invalid', async () => {
    req.headers.authorization = 'InvalidFormat token123';
    
    await authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token format',
      code: 'INVALID_TOKEN'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if token verification fails', async () => {
    req.headers.authorization = 'Bearer invalidToken';
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    await authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if user not found', async () => {
    req.headers.authorization = 'Bearer validToken';
    jwt.verify.mockReturnValue({ userId: 'user123' });
    User.findById.mockResolvedValue(null);
    
    await authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found',
      code: 'UNAUTHORIZED'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should set req.user and call next() if authentication succeeds', async () => {
    const mockUser = { _id: 'user123', role: 'consumer' };
    req.headers.authorization = 'Bearer validToken';
    jwt.verify.mockReturnValue({ userId: 'user123' });
    User.findById.mockResolvedValue(mockUser);
    
    await authenticate(req, res, next);
    
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('User Model Methods', () => {
  let userModel;
  
  beforeEach(() => {
    userModel = new User({
      personalInfo: {
        name: 'Test User',
        email: 'test@example.com'
      },
      password: 'password123',
      role: 'consumer'
    });
    
    // Mock User model methods
    userModel.save = jest.fn().mockResolvedValue(userModel);
    userModel.matchPassword = jest.fn().mockImplementation(async function(password) {
      return await bcrypt.compare(password, this.password);
    });
    userModel.generateAuthToken = jest.fn().mockReturnValue('mock-auth-token');
    userModel.generateRefreshToken = jest.fn().mockReturnValue('mock-refresh-token');
  });
  
  test('should match correct password', async () => {
    // Mock bcrypt.compare
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    
    const isMatch = await userModel.matchPassword('password123');
    
    expect(isMatch).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', userModel.password);
  });
  
  test('should not match incorrect password', async () => {
    // Mock bcrypt.compare
    bcrypt.compare = jest.fn().mockResolvedValue(false);
    
    const isMatch = await userModel.matchPassword('wrongpassword');
    
    expect(isMatch).toBe(false);
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', userModel.password);
  });
  
  test('should generate valid auth token', () => {
    // Mock jwt.sign
    jwt.sign = jest.fn().mockReturnValue('mock-auth-token');
    
    const token = userModel.generateAuthToken();
    
    expect(token).toBe('mock-auth-token');
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: userModel._id, role: userModel.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  });
  
  test('should generate valid refresh token', () => {
    // Mock jwt.sign
    jwt.sign = jest.fn().mockReturnValue('mock-refresh-token');
    
    const token = userModel.generateRefreshToken();
    
    expect(token).toBe('mock-refresh-token');
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: userModel._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  });
});