// ==========================================
// FICHIER: src/api/reviewService.js
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

  // Revendeur - Avis reçus
  getReceivedReviews: async () => {
    const response = await api.get('/reviews/received');
    return response.data;
  },

  // Public - Avis d'un revendeur
  getSellerReviews: async (sellerId) => {
    const response = await api.get(`/reviews/seller/${sellerId}`);
    return response.data;
  }
};

export default reviewService;
