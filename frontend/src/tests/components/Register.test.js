import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Register from '../../pages/auth/Register';
import { register } from '../../store/slices/authSlice';

// Mock the redux store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock the register action
jest.mock('../../store/slices/authSlice', () => ({
  register: jest.fn()
}));

describe('Register Component', () => {
  let store;
  
  beforeEach(() => {
    store = mockStore({
      auth: {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      },
      ui: {
        alertMessage: null,
        alertType: null
      }
    });
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  test('renders registration form correctly', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </Provider>
    );
    
    // Check if the form elements are rendered
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });
  
  test('validates form inputs', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </Provider>
    );
    
    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });
    
    // Fill in invalid email
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' }
    });
    
    // Check for email validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
    
    // Fill in passwords that don't match
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password456' }
    });
    
    // Check for password match error
    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
    });
  });
  
  test('submits form with valid data', async () => {
    // Mock successful registration
    register.mockImplementation(() => {
      return () => Promise.resolve({
        type: 'auth/register/fulfilled',
        payload: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        }
      });
    });
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </Provider>
    );
    
    // Fill in valid form data
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Test' }
    });
    
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'User' }
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Check if register action was dispatched with correct data
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student'
      });
    });
  });
  
  test('handles registration failure', async () => {
    // Mock failed registration
    register.mockImplementation(() => {
      return () => Promise.resolve({
        type: 'auth/register/rejected',
        payload: 'Email already in use'
      });
    });
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </Provider>
    );
    
    // Fill in form data
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Test' }
    });
    
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'User' }
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Check if register action was dispatched
    await waitFor(() => {
      expect(register).toHaveBeenCalled();
    });
  });
});
