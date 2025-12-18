// ==========================================
// FICHIER: src/api/sellerService.js
// ==========================================
import api from './axios';

const sellerService = {
  // Produits
  getMyProducts: async () => {
    const response = await api.get('/products/my-products');
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Commandes reçues
  getReceivedOrders: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/orders/received', { params });
    return response.data;
  },

  acceptOrder: async (orderId, estimatedTime) => {
    const response = await api.put(`/orders/${orderId}/accept`, { estimatedTime });
    return response.data;
  },

  rejectOrder: async (orderId, rejectionReason) => {
    const response = await api.put(`/orders/${orderId}/reject`, { rejectionReason });
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Avis reçus
  getReceivedReviews: async () => {
    const response = await api.get('/reviews/received');
    return response.data;
  }
};

export default sellerService;