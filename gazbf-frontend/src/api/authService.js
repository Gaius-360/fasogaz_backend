// ==========================================
// FICHIER: src/api/authService.js
// ==========================================
import api from './axios';

const authService = {
  // Inscription
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Vérifier OTP
  verifyOTP: async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
  },

  // Renvoyer OTP
  resendOTP: async (phone) => {
    const response = await api.post('/auth/resend-otp', { phone });
    return response.data;
  },

  // Connexion
  login: async (phone, password) => {
    const response = await api.post('/auth/login', { phone, password });
    return response.data;
  },

  // Obtenir profil
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Mettre à jour profil
  updateProfile: async (userData) => {
    const response = await api.put('/auth/update-profile', userData);
    return response.data;
  },

  // Changer mot de passe
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};

export default authService;