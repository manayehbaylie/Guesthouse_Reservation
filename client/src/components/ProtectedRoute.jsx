import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = String(user.role || '').toUpperCase();

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(
      (role) => String(role).toUpperCase() === userRole
    );

    if (!hasAllowedRole) {
      if (userRole === 'ADMIN') {
        return <Navigate to="/admin" replace />;
      }
      if (userRole === 'OWNER') {
        return <Navigate to="/owner" replace />;
      }
      if (userRole === 'RECEPTIONIST') {
        return <Navigate to="/receptionist" replace />;
      }
      if (userRole === 'GUEST') {
        return <Navigate to="/guest/search" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  // Additional route-specific checks
  if (location.pathname.startsWith('/owner') && userRole !== 'OWNER') {
    return <Navigate to="/" replace />;
  }

  if (location.pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (location.pathname.startsWith('/receptionist') && userRole !== 'RECEPTIONIST') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-amber-500" /></div>;
  }
  if (!user) return children;

  const role = String(user.role || "").toUpperCase();
  const destination = role === "OWNER" ? "/owner"
    : role === "ADMIN" ? "/admin"
      : role === "RECEPTIONIST" ? "/receptionist" : "/guest/dashboard";
  return <Navigate to={destination} replace />;
}