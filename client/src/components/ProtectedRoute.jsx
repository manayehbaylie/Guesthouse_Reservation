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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to fallback dashboard based on actual role
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user.role === 'Owner') return <Navigate to="/owner" replace />;
    if (user.role === 'Receptionist') return <Navigate to="/receptionist" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
