import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    const userRole = String(user.role || '').toUpperCase();
    const allowed = allowedRoles.map((role) =>
      String(role).toUpperCase()
    );

    if (!allowed.includes(userRole)) {
      if (userRole === 'ADMIN') {
        return <Navigate to="/admin" replace />;
      }

      if (userRole === 'OWNER') {
        return <Navigate to="/owner" replace />;
      }

      if (userRole === 'RECEPTIONIST') {
        return <Navigate to="/receptionist" replace />;
      }

      return <Navigate to="/" replace />;
    }
  }

  if (
    location.pathname.startsWith('/owner') &&
    String(user.role || '').toUpperCase() !== 'OWNER'
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}