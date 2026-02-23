// ==========================================
// FICHIER: src/api/orderService.js
// ==========================================
import api from './axios';

const orderService = {
  // Créer une commande
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Obtenir mes commandes
  getMyOrders: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/orders/my-orders', { params });
    return response.data;
  },

  // Obtenir une commande par ID
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Annuler une commande
  cancelOrder: async (orderId) => {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response.data;
  }
};

export default orderService;