// ==========================================
// FICHIER: src/store/adminStore.js
// Store pour les données admin
// ==========================================

import { create } from 'zustand';
import { api } from '../api/apiSwitch';

const useAdminStore = create((set, get) => ({
  // État
  stats: null,
  users: [],
  sellers: [],
  pendingSellers: [],
  products: [],
  orders: [],
  subscriptions: [],
  transactions: [],
  reviews: [],
  loading: false,
  error: null,

  // ========================================
  // STATISTIQUES
  // ========================================
  
  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminStats.getDashboardStats();
      set({ 
        stats: response.data || null,
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  // ========================================
  // UTILISATEURS
  // ========================================
  
  fetchAllUsers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminUsers.getAllUsers(params);
      set({ 
        users: response.data?.users || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  toggleUserStatus: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminUsers.toggleUserStatus(userId);
      
      set(state => ({
        users: state.users.map(user => 
          user.id === userId ? response.data : user
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur toggle status:', error);
      set({ 
        error: error.message || 'Erreur lors de l\'opération',
        loading: false 
      });
      throw error;
    }
  },

  deleteUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await api.adminUsers.deleteUser(userId);
      
      set(state => ({
        users: state.users.filter(user => user.id !== userId),
        loading: false
      }));
    } catch (error) {
      console.error('❌ Erreur suppression utilisateur:', error);
      set({ 
        error: error.message || 'Erreur lors de la suppression',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // REVENDEURS
  // ========================================
  
  fetchPendingSellers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminSellers.getPendingSellers();
      set({ 
        pendingSellers: response.data || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement revendeurs:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  fetchAllSellers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminSellers.getAllSellers(params);
      set({ 
        sellers: response.data || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement revendeurs:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  validateSeller: async (sellerId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminSellers.validateSeller(sellerId);
      
      set(state => ({
        pendingSellers: state.pendingSellers.filter(s => s.id !== sellerId),
        sellers: state.sellers.map(s => 
          s.id === sellerId ? response.data : s
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur validation revendeur:', error);
      set({ 
        error: error.message || 'Erreur lors de la validation',
        loading: false 
      });
      throw error;
    }
  },

  rejectSeller: async (sellerId, reason) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminSellers.rejectSeller(sellerId, { reason });
      
      set(state => ({
        pendingSellers: state.pendingSellers.filter(s => s.id !== sellerId),
        sellers: state.sellers.map(s => 
          s.id === sellerId ? response.data : s
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur rejet revendeur:', error);
      set({ 
        error: error.message || 'Erreur lors du rejet',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // PRODUITS
  // ========================================
  
  fetchAllProducts: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminProducts.getAllProducts(params);
      set({ 
        products: response.data?.products || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true, error: null });
    try {
      await api.adminProducts.deleteProduct(productId);
      
      set(state => ({
        products: state.products.filter(p => p.id !== productId),
        loading: false
      }));
    } catch (error) {
      console.error('❌ Erreur suppression produit:', error);
      set({ 
        error: error.message || 'Erreur lors de la suppression',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // COMMANDES
  // ========================================
  
  fetchAllOrders: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminOrders.getAllOrders(params);
      set({ 
        orders: response.data?.orders || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  // ========================================
  // ABONNEMENTS
  // ========================================
  
  fetchAllSubscriptions: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminSubscriptions.getAllSubscriptions(params);
      set({ 
        subscriptions: response.data?.subscriptions || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement abonnements:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  // ========================================
  // TRANSACTIONS
  // ========================================
  
  fetchAllTransactions: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminTransactions.getAllTransactions(params);
      set({ 
        transactions: response.data?.transactions || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement transactions:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  // ========================================
  // AVIS
  // ========================================
  
  fetchAllReviews: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminReviews.getAllReviews(params);
      set({ 
        reviews: response.data?.reviews || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement avis:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  deleteReview: async (reviewId) => {
    set({ loading: true, error: null });
    try {
      await api.adminReviews.deleteReview(reviewId);
      
      set(state => ({
        reviews: state.reviews.filter(r => r.id !== reviewId),
        loading: false
      }));
    } catch (error) {
      console.error('❌ Erreur suppression avis:', error);
      set({ 
        error: error.message || 'Erreur lors de la suppression',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // NOTIFICATIONS
  // ========================================
  
  broadcastNotification: async (notificationData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.adminNotifications.broadcastNotification(notificationData);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      set({ 
        error: error.message || 'Erreur lors de l\'envoi',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // HELPERS
  // ========================================
  
  clearError: () => set({ error: null }),
  
  reset: () => set({
    stats: null,
    users: [],
    sellers: [],
    pendingSellers: [],
    products: [],
    orders: [],
    subscriptions: [],
    transactions: [],
    reviews: [],
    loading: false,
    error: null
  })
}));

export default useAdminStore;