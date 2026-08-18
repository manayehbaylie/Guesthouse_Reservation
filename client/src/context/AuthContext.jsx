import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const current = ApiService.getCurrentUser();
    if (current) {
      setUser(current);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const loggedUser = await ApiService.loginUser(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (userData) => {
    const newUser = await ApiService.registerUser(userData);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    ApiService.setCurrentUser(null);
    setUser(null);
  };

  const switchUser = (targetUser) => {
    // Development/testing feature to switch between users
    // This simulates logging in as a different user for testing purposes
    ApiService.setCurrentUser(targetUser);
    setUser(targetUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    switchUser,
    role: user?.role || 'GUEST',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
