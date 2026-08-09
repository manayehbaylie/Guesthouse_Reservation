import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService, initDatabase } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDatabase();
    const current = ApiService.getCurrentUser();
    setUser(current);
    setLoading(false);
  }, []);

  const login = async (email) => {
    const loggedUser = await ApiService.loginUser(email);
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

  const switchUser = (selectedUser) => {
    ApiService.setCurrentUser(selectedUser);
    setUser(selectedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    switchUser,
    role: user?.role || 'Guest',
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
