import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import MainLayout from '../../components/layouts/MainLayout';

// Mock the redux store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock child components
jest.mock('../../components/navigation/Header', () => () => <div data-testid="header">Header</div>);
jest.mock('../../components/navigation/Sidebar', () => () => <div data-testid="sidebar">Sidebar</div>);
jest.mock('../../components/common/AlertMessage', () => () => <div data-testid="alert-message">Alert</div>);
jest.mock('../../components/common/DialogModal', () => () => <div data-testid="dialog-modal">Dialog</div>);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet">Content</div>
}));

describe('MainLayout Component', () => {
  let store;
  
  beforeEach(() => {
    store = mockStore({
      auth: {
        user: {
          id: '1',
          firstName: 'Test',
          lastName: 'User',
          role: 'admin'
        }
      },
      ui: {
        sidebarOpen: true,
        darkMode: false,
        alertMessage: null,
        alertType: null,
        dialogOpen: false
      }
    });
  });
  
  test('renders layout components correctly', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </Provider>
    );
    
    // Check if all components are rendered
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('alert-message')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-modal')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
  
  test('applies correct styling based on sidebar state', () => {
    // Test with sidebar open
    render(
      <Provider store={store}>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </Provider>
    );
    
    const mainContent = screen.getByTestId('outlet').parentElement;
    expect(mainContent).toHaveStyle('margin-left: 240px');
    
    // Test with sidebar closed
    store = mockStore({
      auth: {
        user: {
          id: '1',
          firstName: 'Test',
          lastName: 'User',
          role: 'admin'
        }
      },
      ui: {
        sidebarOpen: false,
        darkMode: false,
        alertMessage: null,
        alertType: null,
        dialogOpen: false
      }
    });
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </Provider>
    );
    
    const mainContentClosed = screen.getAllByTestId('outlet')[1].parentElement;
    expect(mainContentClosed).toHaveStyle('margin-left: 64px');
  });
});
