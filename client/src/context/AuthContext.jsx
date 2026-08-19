import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { ApiService } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore logged-in user when the application starts
  useEffect(() => {
    try {
      const currentUser = ApiService.getCurrentUser();

      if (currentUser) {
        setUser({
          ...currentUser,
          role: currentUser.role?.toUpperCase(),
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login
  const login = async (email, password) => {
    const loggedUser = await ApiService.loginUser(
      email,
      password
    );

    const normalizedUser = {
      ...loggedUser,
      role: loggedUser.role?.toUpperCase(),
    };

    setUser(normalizedUser);

    return normalizedUser;
  };

  // Registration
  const register = async (userData) => {
    const newUser = await ApiService.registerUser(userData);

    const normalizedUser = {
      ...newUser,
      role: newUser.role?.toUpperCase(),
    };

    setUser(normalizedUser);

    return normalizedUser;
  };

  // Logout
  const logout = () => {
    ApiService.setCurrentUser(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,

    // Always return an uppercase backend role
    role: user?.role?.toUpperCase() || 'GUEST',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}