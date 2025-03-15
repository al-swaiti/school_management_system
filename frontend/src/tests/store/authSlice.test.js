import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout, loadUser } from '../../store/slices/authSlice';

// Mock fetch
global.fetch = jest.fn();

describe('Auth Slice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer
      }
    });
    
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  test('should handle initial state', () => {
    expect(store.getState().auth).toEqual({
      token: null,
      isAuthenticated: false,
      loading: true,
      user: null,
      error: null
    });
  });
  
  test('should handle login.fulfilled', async () => {
    // Mock successful login response
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin'
    };
    
    const mockToken = 'mock-token';
    
    // Dispatch login.fulfilled action
    await store.dispatch({
      type: login.fulfilled.type,
      payload: mockUser
    });
    
    // Check if state is updated correctly
    expect(store.getState().auth).toEqual({
      token: null, // In a real scenario, this would be set by the middleware
      isAuthenticated: true,
      loading: false,
      user: mockUser,
      error: null
    });
  });
  
  test('should handle login.rejected', async () => {
    const errorMessage = 'Invalid credentials';
    
    // Dispatch login.rejected action
    await store.dispatch({
      type: login.rejected.type,
      payload: errorMessage
    });
    
    // Check if state is updated correctly
    expect(store.getState().auth).toEqual({
      token: null,
      isAuthenticated: false,
      loading: false,
      user: null,
      error: errorMessage
    });
  });
  
  test('should handle logout', async () => {
    // First set authenticated state
    await store.dispatch({
      type: login.fulfilled.type,
      payload: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin'
      }
    });
    
    // Then dispatch logout action
    await store.dispatch({
      type: logout.fulfilled.type
    });
    
    // Check if state is reset
    expect(store.getState().auth).toEqual({
      token: null,
      isAuthenticated: false,
      loading: false,
      user: null,
      error: null
    });
  });
  
  test('should handle loadUser.fulfilled', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin'
    };
    
    // Dispatch loadUser.fulfilled action
    await store.dispatch({
      type: loadUser.fulfilled.type,
      payload: mockUser
    });
    
    // Check if state is updated correctly
    expect(store.getState().auth).toEqual({
      token: null,
      isAuthenticated: true,
      loading: false,
      user: mockUser,
      error: null
    });
  });
  
  test('should handle loadUser.rejected', async () => {
    const errorMessage = 'Token expired';
    
    // Dispatch loadUser.rejected action
    await store.dispatch({
      type: loadUser.rejected.type,
      payload: errorMessage
    });
    
    // Check if state is updated correctly
    expect(store.getState().auth).toEqual({
      token: null,
      isAuthenticated: false,
      loading: false,
      user: null,
      error: errorMessage
    });
  });
});
