// ==========================================
// FICHIER: src/api/reviewService.js - AVEC getOrderReviews
// ==========================================
import api from './axios';

const reviewService = {
  // Client - Créer un avis
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Client - Mes avis donnés
  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  // Obtenir les avis d'une commande spécifique
  getOrderReviews: async (orderId) => {
    const response = await api.get(`/reviews/order/${orderId}`);
    return response.data;
  },

  // Revendeur - Avis reçus
  getReceivedReviews: async (type = null) => {
    const params = type ? { type } : {};
    const response = await api.get('/reviews/received', { params });
    return response.data;
  },

  // Revendeur - Répondre à un avis
  respondToReview: async (reviewId, response) => {
    const result = await api.put(`/reviews/${reviewId}/respond`, { response });
    return result.data;
  },

  // Public - Avis d'un revendeur
  getSellerReviews: async (sellerId, params = {}) => {
    const response = await api.get(`/reviews/seller/${sellerId}`, { params });
    return response.data;
  }
};

export default reviewService;