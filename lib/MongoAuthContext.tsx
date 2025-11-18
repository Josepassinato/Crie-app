import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types.ts';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUserTokens: (newTokens: number) => void;
  activateTestMode: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateUserTokens: () => {},
  activateTestMode: () => {},
});

const API_URL = 'http://localhost:8001/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInTestMode, setIsInTestMode] = useState(false);
  
  const activateTestMode = useCallback(() => {
    const mockAdminUser: User = {
      id: 'test-admin-id',
      email: 'admin-test@crie-app.com',
      isAdmin: true,
      tokens: 99999999,
    };
    sessionStorage.setItem('testMode', 'true');
    setCurrentUser(mockAdminUser);
    setLoading(false);
    setIsInTestMode(true);
  }, []);

  useEffect(() => {
    // Check test mode
    if (sessionStorage.getItem('testMode') === 'true') {
      activateTestMode();
      return;
    }

    // Check for existing token
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token
      fetch(`${API_URL}/auth/verify?token=${token}`)
        .then(res => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then(userData => {
          setCurrentUser(userData);
          setLoading(false);
        })
        .catch(err => {
          console.error('Token verification failed:', err);
          localStorage.removeItem('authToken');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [activateTestMode]);

  const login = async (email: string, pass: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    setCurrentUser(data.user);
  };

  const signup = async (email: string, pass: string) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    setCurrentUser(data.user);
  };

  const logout = () => {
    if (isInTestMode) {
      sessionStorage.removeItem('testMode');
      setCurrentUser(null);
      setIsInTestMode(false);
    } else {
      localStorage.removeItem('authToken');
      setCurrentUser(null);
    }
  };

  const updateUserTokens = useCallback(async (newTokens: number) => {
    if (isInTestMode) {
      setCurrentUser((prevUser) => (prevUser ? { ...prevUser, tokens: newTokens } : null));
      return;
    }

    if (currentUser) {
      const response = await fetch(`${API_URL}/users/${currentUser.id}/tokens`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: newTokens }),
      });

      if (response.ok) {
        setCurrentUser((prevUser) => (prevUser ? { ...prevUser, tokens: newTokens } : null));
      }
    }
  }, [currentUser, isInTestMode]);

  const value = { currentUser, loading, login, signup, logout, updateUserTokens, activateTestMode };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
