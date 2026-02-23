// ==========================================
// FICHIER: src/api/adminAuthService.js
// Service d'authentification pour l'administrateur
// ==========================================

import api from './axios';

const adminAuthService = {
  // Connexion administrateur
  login: async (username, password) => {
    const response = await api.post('/admin/auth/login', {
      username,
      password
    });
    return response.data;
  },

  // Obtenir le profil admin
  getProfile: async () => {
    const response = await api.get('/admin/auth/me');
    return response.data;
  },

  // Changer le mot de passe admin
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/admin/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }
};

export default adminAuthService;