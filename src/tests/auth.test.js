import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import ProtectedRoute from '../components/Auth/ProtectedRoute';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  post: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Test component to access auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, register, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <button data-testid="login-btn" onClick={() => login({ email: 'test@test.com', password: 'password' })}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('AuthProvider', () => {
    test('provides authentication context', () => {
      renderWithAuth(<TestComponent />);
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });

    test('handles existing token on mount', async () => {
      localStorageMock.getItem.mockReturnValue('fake-token');
      
      renderWithAuth(<TestComponent />);
      
      // Should attempt to validate token
      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('LoginForm', () => {
    test('renders login form correctly', () => {
      renderWithAuth(<LoginForm />);
      
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    test('validates email field', async () => {
      renderWithAuth(<LoginForm />);
      
      const emailInput = screen.getByPlaceholderText('Email address');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('validates required fields', async () => {
      renderWithAuth(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });
  });

  describe('RegisterForm', () => {
    test('renders registration form correctly', () => {
      renderWithAuth(<RegisterForm />);
      
      expect(screen.getByPlaceholderText('Enter your first name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your middle name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your last name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    test('generates initials preview', async () => {
      renderWithAuth(<RegisterForm />);
      
      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      
      await waitFor(() => {
        expect(screen.getByText('J.D')).toBeInTheDocument();
      });
    });

    test('generates initials with middle name', async () => {
      renderWithAuth(<RegisterForm />);
      
      const firstNameInput = screen.getByPlaceholderText('Enter your first name');
      const middleNameInput = screen.getByPlaceholderText('Enter your middle name');
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(middleNameInput, { target: { value: 'Robert' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      
      await waitFor(() => {
        expect(screen.getByText('J.R.D')).toBeInTheDocument();
      });
    });

    test('validates password requirements', async () => {
      renderWithAuth(<RegisterForm />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument();
      });
    });

    test('validates password confirmation', async () => {
      renderWithAuth(<RegisterForm />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('ProtectedRoute', () => {
    test('shows loading when checking authentication', () => {
      const TestProtectedComponent = () => <div>Protected Content</div>;
      
      renderWithAuth(
        <ProtectedRoute>
          <TestProtectedComponent />
        </ProtectedRoute>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('redirects to login when not authenticated', async () => {
      const TestProtectedComponent = () => <div>Protected Content</div>;
      
      renderWithAuth(
        <ProtectedRoute>
          <TestProtectedComponent />
        </ProtectedRoute>
      );
      
      // Should redirect to login (would be handled by router in real app)
      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Header', () => {
    test('shows user information when authenticated', () => {
      // This would require mocking the auth context with a logged-in user
      // Implementation depends on how we structure the test
    });

    test('handles logout correctly', () => {
      // Test logout functionality
    });
  });

  describe('API Integration', () => {
    test('handles token refresh on 401 errors', () => {
      // Test token refresh logic
    });

    test('redirects to login when refresh token expires', () => {
      // Test refresh token expiration
    });
  });
});

describe('Initials Generation', () => {
  test('generates correct initials format', () => {
    // Test cases for initials generation
    const testCases = [
      { first: 'John', middle: '', last: 'Doe', expected: 'J.D' },
      { first: 'John', middle: 'Robert', last: 'Doe', expected: 'J.R.D' },
      { first: 'Jane', middle: null, last: 'Smith', expected: 'J.S' },
      { first: 'a', middle: 'b', last: 'c', expected: 'A.B.C' },
    ];

    testCases.forEach(({ first, middle, last, expected }) => {
      // This would test the initials generation logic
      // Implementation depends on how we expose the function
    });
  });
});

// Integration test for complete auth flow
describe('Authentication Flow Integration', () => {
  test('complete registration and login flow', async () => {
    // Test the complete flow from registration to login
    // This would involve mocking API responses and testing state changes
  });

  test('protected route access after authentication', async () => {
    // Test that protected routes are accessible after successful authentication
  });

  test('logout clears authentication state', async () => {
    // Test that logout properly clears all authentication state
  });
}); 