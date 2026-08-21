
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { ApiService } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const currentUser = ApiService.getCurrentUser();

      setUser(currentUser || null);
    } catch (error) {
      console.error(
        "Auth initialization failed:",
        error
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const loggedUser =
      await ApiService.loginUser(
        email,
        password
      );

    setUser(loggedUser);

    return loggedUser;
  };

  const register = async (userData) => {
    const result =
      await ApiService.registerUser(
        userData
      );

    if (!result?.requiresApproval) {
      setUser(result);
    }

    return result;
  };

  const logout = () => {
    ApiService.setCurrentUser(null);
    setUser(null);
  };

  const switchUser = (targetUser) => {
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
    role: user?.role
      ? String(user.role).toUpperCase()
      : null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}

