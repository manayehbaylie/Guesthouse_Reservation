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
  const [authError, setAuthError] = useState(null);

  // ============================================================
  // INITIALIZE AUTH STATE
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check if user is already logged in (from localStorage)
        const currentUser = ApiService.getCurrentUser();
        
        if (mounted) {
          setUser(currentUser || null);
          setAuthError(null);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        
        if (mounted) {
          setUser(null);
          setAuthError(error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (identifier, password, loginMethod = 'email') => {
    setAuthError(null);
    setLoading(true);

    try {
      if (!identifier || !password) {
        throw new Error("Email/Phone and password are required");
      }

      const loggedUser = await ApiService.loginUser(identifier, password, loginMethod);

      if (!loggedUser) {
        throw new Error("Login failed - no user data returned");
      }

      setUser(loggedUser);
      
      // Dispatch custom event for login
      window.dispatchEvent(new CustomEvent("auth-login", {
        detail: { user: loggedUser }
      }));

      return loggedUser;

    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.message || "Login failed. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const register = async (userData) => {
    setAuthError(null);
    setLoading(true);

    try {
      if (!userData) {
        throw new Error("User data is required");
      }

      const result = await ApiService.registerUser(userData);

      if (!result) {
        throw new Error("Registration failed - no data returned");
      }

      // If registration doesn't require approval, set user
      if (!result?.requiresApproval) {
        setUser(result);
        
        // Dispatch custom event for registration
        window.dispatchEvent(new CustomEvent("auth-register", {
          detail: { user: result }
        }));
      } else {
        // For owner registration with approval
        window.dispatchEvent(new CustomEvent("auth-register-pending", {
          detail: { result }
        }));
      }

      return result;

    } catch (error) {
      console.error("Registration error:", error);
      setAuthError(error.message || "Registration failed. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    try {
      ApiService.logoutUser();
      setUser(null);
      setAuthError(null);
      
      // Dispatch custom event for logout
      window.dispatchEvent(new CustomEvent("auth-logout"));
      
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ============================================================
  // SWITCH USER (for admin/owner switching)
  // ============================================================

  const switchUser = (targetUser) => {
    try {
      ApiService.setCurrentUser(targetUser);
      setUser(targetUser);
      
      // Dispatch custom event for user switch
      window.dispatchEvent(new CustomEvent("auth-switch", {
        detail: { user: targetUser }
      }));
      
    } catch (error) {
      console.error("Switch user error:", error);
    }
  };

  // ============================================================
  // UPDATE USER PROFILE
  // ============================================================

  const updateUser = (updatedData) => {
    try {
      if (!user) {
        throw new Error("No user logged in");
      }

      const updatedUser = {
        ...user,
        ...updatedData,
      };

      ApiService.setCurrentUser(updatedUser);
      setUser(updatedUser);

      return updatedUser;

    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  // ============================================================
  // CHECK IF USER IS AUTHENTICATED
  // ============================================================

  const isAuthenticated = () => {
    return !!user && !!user.id;
  };

  // ============================================================
  // CHECK USER ROLE
  // ============================================================

  const hasRole = (role) => {
    if (!user) return false;
    return String(user.role).toUpperCase() === String(role).toUpperCase();
  };

  const isGuest = () => hasRole('GUEST');
  const isOwner = () => hasRole('OWNER');
  const isAdmin = () => hasRole('ADMIN');
  const isReceptionist = () => hasRole('RECEPTIONIST');

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value = {
    // State
    user,
    loading,
    authError,
    
    // Auth methods
    login,
    register,
    logout,
    switchUser,
    updateUser,
    
    // Check methods
    isAuthenticated,
    hasRole,
    isGuest,
    isOwner,
    isAdmin,
    isReceptionist,
    
    // Role helper
    role: user?.role ? String(user.role).toUpperCase() : null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// CUSTOM HOOK
// ============================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}

// ============================================================
// HELPER HOOK FOR AUTH STATE
// ============================================================

export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [user, loading, navigate, redirectTo]);

  return { user, loading };
}