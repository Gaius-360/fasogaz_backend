// ==========================================
// FICHIER: src/api/productService.js
// ==========================================
import api from './axios';

const productService = {
  // Rechercher des produits
  searchProducts: async (params) => {
    const response = await api.get('/products/search', { params });
    return response.data;
  },

  // Obtenir les produits d'un revendeur
  getSellerProducts: async (sellerId) => {
    const response = await api.get(`/products/seller/${sellerId}`);
    return response.data;
  },

  // Incrémenter le compteur de vues
  incrementView: async (productId) => {
    const response = await api.post(`/products/${productId}/view`);
    return response.data;
  }
};

export default productService;