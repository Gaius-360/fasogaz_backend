// ==========================================
// FICHIER: src/components/common/ProtectedAgentRoute.jsx
// Route protégée pour les agents terrain
// ✅ CORRECTION: Vérifier seulement isAgentActive (pas isActive)
// ==========================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedAgentRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  // Pas authentifié → Login
  if (!isAuthenticated) {
    return <Navigate to="/secure/agent/7h3k9m2p5n8q/login" replace />;
  }

  // Authentifié mais pas agent → Accueil
  if (user?.role !== 'agent') {
    return <Navigate to="/" replace />;
  }

  // ✅ CORRECTION: Vérifier seulement isAgentActive (isActive peut être undefined)
  if (!user.isAgentActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Compte Agent Désactivé
          </h2>
          <p className="text-gray-600 mb-6">
            Votre compte agent a été désactivé. Veuillez contacter un administrateur.
          </p>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.href = '/secure/agent/7h3k9m2p5n8q/login';
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Se Déconnecter
          </button>
        </div>
      </div>
    );
  }

  // Tout est OK → Afficher le contenu
  return children;
};

export default ProtectedAgentRoute;