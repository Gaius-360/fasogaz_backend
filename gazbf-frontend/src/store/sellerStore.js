// ==========================================
// FICHIER: src/store/sellerStore.js - VERSION COMPLÈTE
// ==========================================

import { create } from 'zustand';
import { api } from '../api/apiSwitch';

const useSellerStore = create((set, get) => ({
  // État
  products: [],
  orders: [],
  reviews: [],
  stats: null,
  loading: false,
  error: null,

  // ========================================
  // PRODUITS
  // ========================================
  
  fetchMyProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.seller.getMyProducts();
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

  createProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.createProduct(productData);
      
      set(state => ({
        products: [response.data, ...state.products],
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      set({ 
        error: error.message || 'Erreur lors de la création',
        loading: false 
      });
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.updateProduct(id, productData);
      
      set(state => ({
        products: state.products.map(product => 
          product.id === id ? response.data : product
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour produit:', error);
      set({ 
        error: error.message || 'Erreur lors de la mise à jour',
        loading: false 
      });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.products.deleteProduct(id);
      
      set(state => ({
        products: state.products.filter(product => product.id !== id),
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
  
  fetchReceivedOrders: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.seller.getReceivedOrders(params);
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

  acceptOrder: async (orderId, estimatedTime) => {
    set({ loading: true, error: null });
    try {
      const response = await api.seller.acceptOrder(orderId, { estimatedTime });
      
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? response.data : order
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur acceptation commande:', error);
      set({ 
        error: error.message || 'Erreur lors de l\'acceptation',
        loading: false 
      });
      throw error;
    }
  },

  rejectOrder: async (orderId, reason) => {
    set({ loading: true, error: null });
    try {
      const response = await api.seller.rejectOrder(orderId, { reason });
      
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? response.data : order
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur rejet commande:', error);
      set({ 
        error: error.message || 'Erreur lors du rejet',
        loading: false 
      });
      throw error;
    }
  },

  // ✅ AJOUTER CETTE FONCTION
  updateOrderStatus: async (orderId, newStatus) => {
    set({ loading: true, error: null });
    try {
      const response = await api.seller.updateOrderStatus(orderId, { status: newStatus });
      
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      set({ 
        error: error.message || 'Erreur lors de la mise à jour',
        loading: false 
      });
      throw error;
    }
  },

  completeOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.seller.completeOrder(orderId);
      
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? response.data : order
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur complétion commande:', error);
      set({ 
        error: error.message || 'Erreur lors de la complétion',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // AVIS
  // ========================================
  
  fetchMyReviews: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.seller.getReviews();
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

  respondToReview: async (reviewId, response) => {
    set({ loading: true, error: null });
    try {
      const responseData = await api.reviews.respondToReview(reviewId, { response });
      
      set(state => ({
        reviews: state.reviews.map(review => 
          review.id === reviewId ? responseData.data : review
        ),
        loading: false
      }));
      
      return responseData.data;
    } catch (error) {
      console.error('❌ Erreur réponse avis:', error);
      set({ 
        error: error.message || 'Erreur lors de la réponse',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // STATISTIQUES
  // ========================================
  
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.seller.getStats();
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
  // HELPERS
  // ========================================
  
  clearError: () => set({ error: null }),
  
  reset: () => set({
    products: [],
    orders: [],
    reviews: [],
    stats: null,
    loading: false,
    error: null
  })
}));

export default useSellerStore;