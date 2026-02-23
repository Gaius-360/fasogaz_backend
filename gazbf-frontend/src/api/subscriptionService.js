// ==========================================
// FICHIER: src/api/subscriptionService.js
// Services API pour les abonnements
// ==========================================

export const subscriptionService = {
  /**
   * Récupérer mon abonnement actuel
   */
  getMySubscription: async () => {
    try {
      const response = await apiClient.get('/subscriptions/my-subscription');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération abonnement:', error);
      throw error;
    }
  },

  /**
   * Créer un nouvel abonnement
   */
  createSubscription: async (data) => {
    try {
      const response = await apiClient.post('/subscriptions', data);
      return response.data;
    } catch (error) {
      console.error('Erreur création abonnement:', error);
      throw error;
    }
  },

  /**
   * Renouvellement anticipé (une seule fois avant expiration)
   * Prolonge la date d'expiration actuelle
   */
  earlyRenewal: async (paymentData) => {
    try {
      const response = await apiClient.put('/subscriptions/early-renewal', paymentData);
      return response.data;
    } catch (error) {
      console.error('Erreur renouvellement anticipé:', error);
      throw error;
    }
  },

  /**
   * Renouveler un abonnement
   */
  renewSubscription: async (paymentData) => {
    try {
      const response = await apiClient.put('/subscriptions/renew', paymentData);
      return response.data;
    } catch (error) {
      console.error('Erreur renouvellement abonnement:', error);
      throw error;
    }
  },

  /**
   * Supprimer immédiatement l'abonnement actif
   */
  deleteSubscription: async () => {
    try {
      const response = await apiClient.delete('/subscriptions');
      return response.data;
    } catch (error) {
      console.error('Erreur suppression abonnement:', error);
      throw error;
    }
  },

  /**
   * Récupérer les plans disponibles
   */
  getAvailablePlans: async () => {
    try {
      const response = await apiClient.get('/subscriptions/plans');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération plans:', error);
      throw error;
    }
  }
};


