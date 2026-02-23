// ==========================================
// FICHIER: src/api/pricingService.js
// Services API pour la tarification dynamique
// ==========================================

import { apiClient } from './apiClient';

export const pricingService = {
  /**
   * Récupérer la configuration de tarification pour les clients
   */
  getClientConfig: async () => {
    try {
      const response = await apiClient.get('/pricing/client');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération config client:', error);
      throw error;
    }
  },

  /**
   * Récupérer la configuration de tarification pour les revendeurs
   */
  getSellerConfig: async () => {
    try {
      const response = await apiClient.get('/pricing/seller');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération config revendeur:', error);
      throw error;
    }
  },

  /**
   * Récupérer toute la configuration de tarification (admin)
   */
  getAllConfig: async () => {
    try {
      const response = await apiClient.get('/admin/settings/pricing');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération config complète:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour la configuration de tarification (admin)
   */
  updateConfig: async (targetRole, config) => {
    try {
      const response = await apiClient.put('/admin/settings/pricing', {
        targetRole,
        ...config
      });
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour config:', error);
      throw error;
    }
  }
};