// ==========================================
// FICHIER: src/components/common/ProtectedRoute.jsx
// ==========================================
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  // Si pas authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés et l'utilisateur n'a pas le bon rôle
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Rediriger selon le rôle
    if (user?.role === 'client') {
      return <Navigate to="/client/map" replace />;
    } else if (user?.role === 'revendeur') {
      return <Navigate to="/seller/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;