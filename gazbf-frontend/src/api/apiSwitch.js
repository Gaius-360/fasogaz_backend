// ==========================================
// FICHIER: src/api/apiSwitch.js (VERSION COMPLÈTE)
// Configuration API avec support multi-rôles (clients, revendeurs, admins, agents)
// ✅ AJOUT: Routes push notifications
// ==========================================

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// INSTANCES AXIOS
// ============================================

const userApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const adminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ============================================
// INTERCEPTEURS - TOKENS
// ============================================

userApi.interceptors.request.use(
  (config) => {
    const agentToken = localStorage.getItem('agentToken');
    const token = localStorage.getItem('token');
    const authToken = agentToken || token;
    if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// INTERCEPTEURS - ERREURS
// ============================================

userApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const agentToken = localStorage.getItem('agentToken');
      if (agentToken) {
        localStorage.removeItem('agentToken');
        localStorage.removeItem('agentUser');
        window.location.href = '/secure/agent/7h3k9m2p5n8q/login';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ============================================
// API ENDPOINTS
// ============================================

export const api = {

  // ==========================================
  // AUTH UTILISATEUR
  // ==========================================
  auth: {
    register: (data) => userApi.post('/auth/register', data),
    verifyOTP: (data) => userApi.post('/auth/verify-otp', data),
    resendOTP: (data) => userApi.post('/auth/resend-otp', data),
    login: (data) => userApi.post('/auth/login', data),
    forgotPassword: (data) => userApi.post('/auth/forgot-password', data),
    resetPassword: (data) => userApi.post('/auth/reset-password', data),
    getMe: () => userApi.get('/auth/me'),
    updateProfile: (data) => userApi.put('/auth/update-profile', data),
    updateDeliverySettings: (data) => userApi.put('/auth/update-delivery', data),
    changePassword: (data) => userApi.put('/auth/change-password', data),
    deleteAccount: (data) => userApi.delete('/auth/delete-account', { data }),
  },

  // ==========================================
  // NOTIFICATIONS IN-APP
  // ==========================================
  notifications: {
    getMyNotifications: (params) =>
      userApi.get('/notifications', { params }),
    getUnreadCount: () =>
      userApi.get('/notifications/unread-count'),
    markAsRead: (notificationId) =>
      userApi.put(`/notifications/${notificationId}/read`),
    markAllAsRead: () =>
      userApi.put('/notifications/mark-all-read'),
    deleteNotification: (notificationId) =>
      userApi.delete(`/notifications/${notificationId}`),
    clearReadNotifications: () =>
      userApi.delete('/notifications/clear-read'),
  },

  // ==========================================
  // ✅ PUSH NOTIFICATIONS (NOUVEAU)
  // ==========================================
  push: {
    // Enregistrer l'abonnement push de l'appareil
    subscribe: (data) =>
      userApi.post('/push/subscribe', data),
    // Se désabonner
    unsubscribe: (data) =>
      userApi.delete('/push/unsubscribe', { data }),
    // Vérifier si l'appareil est abonné côté serveur
    getStatus: () =>
      userApi.get('/push/status'),
  },

  // ==========================================
  // ACCÈS 24H (CLIENT)
  // ==========================================
  access: {
    getPricing: () => userApi.get('/access/pricing'),
    checkStatus: () => userApi.get('/access/status'),
    purchase: (data) => userApi.post('/access/purchase', data),
    getHistory: (params) => userApi.get('/access/history', { params }),
    getStats: () => userApi.get('/access/stats'),
  },

  // ==========================================
  // PRODUCTS
  // ==========================================
  products: {
    searchProducts: (params) => userApi.get('/products/search', { params }),
    getSellerProducts: (sellerId) => userApi.get(`/products/seller/${sellerId}`),
    createProduct: (data) => userApi.post('/products', data),
    getMyProducts: () => userApi.get('/products/my-products'),
    updateProduct: (id, data) => userApi.put(`/products/${id}`, data),
    deleteProduct: (id) => userApi.delete(`/products/${id}`),
    incrementView: (id) => userApi.post(`/products/${id}/view`),
  },

  // ==========================================
  // ORDERS
  // ==========================================
  orders: {
    createOrder: (data) => userApi.post('/orders', data),
    getMyOrders: () => userApi.get('/orders/my-orders'),
    getOrderById: (id) => userApi.get(`/orders/${id}`),
    cancelOrder: (id) => userApi.put(`/orders/${id}/cancel`),
  },

  // ==========================================
  // SUBSCRIPTIONS (REVENDEURS)
  // ==========================================
  subscriptions: {
    getPlans: () => userApi.get('/subscriptions/plans'),
    createSubscription: (data) => userApi.post('/subscriptions', data),
    getMySubscription: () => userApi.get('/subscriptions/my-subscription'),
    earlyRenewal: (data) => userApi.put('/subscriptions/early-renewal', data),
    deleteSubscription: () => userApi.delete('/subscriptions'),
    renewSubscription: (data) => userApi.put('/subscriptions/renew', data),
  },

  // ==========================================
  // ADDRESSES
  // ==========================================
  addresses: {
    createAddress: (data) => userApi.post('/addresses', data),
    getMyAddresses: () => userApi.get('/addresses'),
    getAddressById: (id) => userApi.get(`/addresses/${id}`),
    updateAddress: (id, data) => userApi.put(`/addresses/${id}`, data),
    deleteAddress: (id) => userApi.delete(`/addresses/${id}`),
    setDefaultAddress: (id) => userApi.put(`/addresses/${id}/set-default`),
  },

  // ==========================================
  // REVIEWS
  // ==========================================
  reviews: {
    createReview: (data) => userApi.post('/reviews', data),
    getMyReviews: () => userApi.get('/reviews/my-reviews'),
    getSellerReviews: (sellerId, params) =>
      userApi.get(`/reviews/seller/${sellerId}`, { params }),
    getReceivedReviews: () => userApi.get('/reviews/received'),
    respondToReview: (id, data) => userApi.put(`/reviews/${id}/respond`, data),
  },

  // ==========================================
  // SELLER
  // ==========================================
  seller: {
    getStats: () => userApi.get('/seller/stats'),
    getMyProducts: () => userApi.get('/seller/products'),
    getProductsStats: () => userApi.get('/seller/products/stats'),
    getReceivedOrders: (params) => userApi.get('/seller/orders', { params }),
    getOrdersStats: () => userApi.get('/seller/orders/stats'),
    acceptOrder: (id, data) => userApi.put(`/seller/orders/${id}/accept`, data),
    rejectOrder: (id, data) => userApi.put(`/seller/orders/${id}/reject`, data),
    completeOrder: (id) => userApi.put(`/seller/orders/${id}/complete`),
    getReviews: () => userApi.get('/seller/reviews'),
    updateOrderStatus: (orderId, data) => userApi.put(`/orders/${orderId}/status`, data),
  },

  // ==========================================
  // ADMIN AUTH
  // ==========================================
  adminAuth: {
    login: (username, password) =>
      adminApi.post('/admin/auth/login', { username, password }),
    getProfile: () =>
      adminApi.get('/admin/auth/profile'),
    changePassword: (currentPassword, newPassword) =>
      adminApi.put('/admin/auth/change-password', { currentPassword, newPassword }),
  },

  // ==========================================
  // ADMIN STATS
  // ==========================================
  adminStats: {
    getDashboardStats: () =>
      adminApi.get('/admin/stats/dashboard'),
    getRevenueChart: (period) =>
      adminApi.get('/admin/stats/revenue', { params: { period } }),
    getTopSellers: (limit) =>
      adminApi.get('/admin/stats/top-sellers', { params: { limit } }),
  },

  // ==========================================
  // ADMIN - Namespace principal
  // ==========================================
  admin: {

    wallet: {
      getBalance: () => adminApi.get('/admin/wallet/balance'),
      getWithdrawals: () => adminApi.get('/admin/wallet/withdrawals'),
      withdraw: (amount, method, details) =>
        adminApi.post('/admin/wallet/withdraw', { amount, method, details }),
    },

    transactions: {
      getAll: (params) => adminApi.get('/admin/transactions', { params }),
      getStats: (period) =>
        adminApi.get('/admin/transactions/stats', { params: { period } }),
      validate: (id) => adminApi.put(`/admin/transactions/${id}/validate`),
    },

    settings: {
      get: () => adminApi.get('/admin/settings'),
      update: (data) => adminApi.put('/admin/settings', data),
      getPricing: () => adminApi.get('/admin/settings/pricing'),
      updatePricing: (data) => adminApi.put('/admin/settings/pricing', data),
    },

    pricing: {
      getAll: () => adminApi.get('/admin/pricing'),
      updateClient: (data) => adminApi.put('/admin/pricing/client', data),
      updateRevendeur: (data) => adminApi.put('/admin/pricing/revendeur', data),
      getClientStats: () => adminApi.get('/admin/pricing/client/stats'),
      getClientPurchases: (params) =>
        adminApi.get('/admin/pricing/client/purchases', { params }),
    },

    sellers: {
      getAll: (params) => adminApi.get('/admin/sellers', { params }),
      getById: (id) => adminApi.get(`/admin/sellers/${id}`),
      getPending: () => adminApi.get('/admin/sellers/pending'),
      validate: (id, message) =>
        adminApi.put(`/admin/sellers/${id}/validate`, { message }),
      reject: (id, reason, message) =>
        adminApi.put(`/admin/sellers/${id}/reject`, { reason, message }),
      suspend: (id, reason, duration) =>
        adminApi.put(`/admin/sellers/${id}/suspend`, { reason, duration }),
      reactivate: (id) => adminApi.put(`/admin/sellers/${id}/reactivate`),
      delete: (id) => adminApi.delete(`/admin/sellers/${id}`),
    },

    clients: {
      getAll: (params) => adminApi.get('/admin/clients', { params }),
      getById: (id) => adminApi.get(`/admin/clients/${id}`),
      block: (id, reason) => adminApi.put(`/admin/clients/${id}/block`, { reason }),
      unblock: (id) => adminApi.put(`/admin/clients/${id}/unblock`),
      delete: (id) => adminApi.delete(`/admin/clients/${id}`),
    },

    agents: {
      getAll: (params) => adminApi.get('/admin/agents', { params }),
      getById: (id) => adminApi.get(`/admin/agents/${id}`),
      create: (data) => adminApi.post('/admin/agents', data),
      update: (id, data) => adminApi.put(`/admin/agents/${id}`, data),
      toggleStatus: (id) => adminApi.put(`/admin/agents/${id}/toggle-status`),
      delete: (id) => adminApi.delete(`/admin/agents/${id}`),
      regenerateCode: (id) => adminApi.put(`/admin/agents/${id}/regenerate-code`),
    },
  },

  // ==========================================
  // AGENT AUTH
  // ==========================================
  agentAuth: {
    login: (agentCode) => userApi.post('/agent/auth/login', { agentCode }),
    verifyCode: (agentCode) => userApi.post('/agent/auth/verify-code', { agentCode }),
    getProfile: () => userApi.get('/agent/auth/profile'),
    updateProfile: (data) => userApi.put('/agent/auth/profile', data),
  },

  // ==========================================
  // PRICING - Config publique
  // ==========================================
  pricing: {
    getClientConfig: () => userApi.get('/pricing/client'),
    getRevendeurConfig: () => userApi.get('/pricing/revendeur'),
    getAccessStatus: () => userApi.get('/pricing/status'),
  },

  // ==========================================
  // INVITATIONS
  // ==========================================
  invitations: {
    verify: (token) => userApi.get(`/invitations/verify/${token}`),

    generate: (data) => {
      const adminToken = localStorage.getItem('adminToken');
      const agentToken = localStorage.getItem('agentToken');
      if (adminToken) return adminApi.post('/invitations/generate', data);
      if (agentToken) return userApi.post('/invitations/generate', data);
      return Promise.reject({ message: 'Non authentifié' });
    },

    getMyInvitations: (params) => {
      const adminToken = localStorage.getItem('adminToken');
      const agentToken = localStorage.getItem('agentToken');
      if (adminToken) return adminApi.get('/invitations/my-invitations', { params });
      if (agentToken) return userApi.get('/invitations/my-invitations', { params });
      return Promise.reject({ message: 'Non authentifié' });
    },

    revoke: (id, reason) =>
      adminApi.put(`/invitations/${id}/revoke`, { reason }),
    getStats: (period) =>
      adminApi.get('/invitations/stats', { params: { period } }),
  },

  // ==========================================
  // PAIEMENTS LIGDICASH
  // ==========================================
  payments: {
    initiatePayment: (data) => userApi.post('/payments/initiate', data),
    checkStatus: (transactionNumber) =>
      userApi.get(`/payments/status/${transactionNumber}`),
    handleCallback: (data) =>
      userApi.post('/payments/ligdicash/callback', data),
  },
};

export default userApi;