// ==========================================
// FICHIER: src/api/accessService.js
// Services API pour vérifier l'accès utilisateur
// ==========================================

export const accessService = {
  /**
   * Récupérer le statut d'accès de l'utilisateur
   */
  getAccessStatus: async () => {
    try {
      const response = await apiClient.get('/auth/access-status');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération statut accès:', error);
      throw error;
    }
  },

  /**
   * Vérifier si l'utilisateur peut accéder à une fonctionnalité
   */
  checkFeatureAccess: async (featureName) => {
    try {
      const response = await apiClient.get(`/auth/check-access/${featureName}`);
      return response.data;
    } catch (error) {
      console.error('Erreur vérification accès:', error);
      throw error;
    }
  }
};
