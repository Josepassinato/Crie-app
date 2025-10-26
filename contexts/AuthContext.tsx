import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => void;
  logout: () => void;
  updateUserTokens: (newTokens: number) => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
  updateUserTokens: () => {},
});

// Mock user data
const MOCK_USER: User = { id: '1', email: 'user@example.com', tokens: 500, isAdmin: false };
const MOCK_ADMIN: User = { id: '2', email: 'admin@example.com', tokens: 10000, isAdmin: true };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (email: string, pass: string) => {
    // In a real app, this would be an API call
    if (email === MOCK_ADMIN.email && pass === 'admin') {
      setCurrentUser(MOCK_ADMIN);
    } else if (email === MOCK_USER.email && pass === 'user') {
      setCurrentUser(MOCK_USER);
    } else {
        // for simplicity, let's log in anyone
        setCurrentUser({ id: '3', email, tokens: 20, isAdmin: false });
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateUserTokens = useCallback((newTokens: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, tokens: newTokens });
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUserTokens }}>
      {children}
    </AuthContext.Provider>
  );
};
