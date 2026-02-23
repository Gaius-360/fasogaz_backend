// ==========================================
// FICHIER: src/store/clientStore.js - VERSION CORRIGÉE
// ==========================================

import { create } from 'zustand';
import { api } from '../api/apiSwitch';

const useClientStore = create((set, get) => ({
  // État
  orders: [],
  addresses: [],
  reviews: [],
  subscription: null,
  loading: false,
  error: null,

  // ========================================
  // COMMANDES
  // ========================================
  
  fetchMyOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.orders.getMyOrders();
      
      // CORRECTION: L'API retourne response.data directement comme tableau
      const ordersData = Array.isArray(response.data) ? response.data : [];
      
      console.log('✅ Commandes chargées:', ordersData.length);
      
      set({ 
        orders: ordersData,
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement des commandes',
        loading: false 
      });
    }
  },

  createOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.orders.createOrder(orderData);
      
      console.log('✅ Commande créée:', response.data);
      
      // Ajouter la nouvelle commande au début de la liste
      set(state => ({
        orders: [response.data, ...state.orders],
        loading: false
      }));
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création commande:', error);
      set({ 
        error: error.message || 'Erreur lors de la création',
        loading: false 
      });
      throw error;
    }
  },

  cancelOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      await api.orders.cancelOrder(orderId);
      
      // Mettre à jour le statut de la commande
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' }
            : order
        ),
        loading: false
      }));
    } catch (error) {
      console.error('❌ Erreur annulation commande:', error);
      set({ 
        error: error.message || 'Erreur lors de l\'annulation',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // ADRESSES
  // ========================================
  
  fetchMyAddresses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.addresses.getMyAddresses();
      set({ 
        addresses: response.data || [],
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement adresses:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  createAddress: async (addressData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.addresses.createAddress(addressData);
      
      set(state => ({
        addresses: [...state.addresses, response.data],
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création adresse:', error);
      set({ 
        error: error.message || 'Erreur lors de la création',
        loading: false 
      });
      throw error;
    }
  },

  updateAddress: async (id, addressData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.addresses.updateAddress(id, addressData);
      
      set(state => ({
        addresses: state.addresses.map(addr => 
          addr.id === id ? response.data : addr
        ),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour adresse:', error);
      set({ 
        error: error.message || 'Erreur lors de la mise à jour',
        loading: false 
      });
      throw error;
    }
  },

  deleteAddress: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.addresses.deleteAddress(id);
      
      set(state => ({
        addresses: state.addresses.filter(addr => addr.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('❌ Erreur suppression adresse:', error);
      set({ 
        error: error.message || 'Erreur lors de la suppression',
        loading: false 
      });
      throw error;
    }
  },

  setDefaultAddress: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.addresses.setDefaultAddress(id);
      
      set(state => ({
        addresses: state.addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === id
        })),
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur définition adresse par défaut:', error);
      set({ 
        error: error.message || 'Erreur lors de l\'opération',
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
      const response = await api.reviews.getMyReviews();
      set({ 
        reviews: response.data || [],
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

  createReview: async (reviewData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.reviews.createReview(reviewData);
      
      set(state => ({
        reviews: [response.data, ...state.reviews],
        loading: false
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création avis:', error);
      set({ 
        error: error.message || 'Erreur lors de la création',
        loading: false 
      });
      throw error;
    }
  },

  // ========================================
  // ABONNEMENT
  // ========================================
  
  fetchMySubscription: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.subscriptions.getMySubscription();
      set({ 
        subscription: response.data || null,
        loading: false 
      });
    } catch (error) {
      console.error('❌ Erreur chargement abonnement:', error);
      set({ 
        error: error.message || 'Erreur lors du chargement',
        loading: false 
      });
    }
  },

  createSubscription: async (subscriptionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.subscriptions.createSubscription(subscriptionData);
      
      set({ 
        subscription: response.data,
        loading: false 
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création abonnement:', error);
      set({ 
        error: error.message || 'Erreur lors de la création',
        loading: false 
      });
      throw error;
    }
  },

  cancelSubscription: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.subscriptions.cancelSubscription();
      
      set({ 
        subscription: response.data,
        loading: false 
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur annulation abonnement:', error);
      set({ 
        error: error.message || 'Erreur lors de l\'annulation',
        loading: false 
      });
      throw error;
    }
  },

  renewSubscription: async (paymentData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.subscriptions.renewSubscription(paymentData);
      
      set({ 
        subscription: response.data,
        loading: false 
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur renouvellement abonnement:', error);
      set({ 
        error: error.message || 'Erreur lors du renouvellement',
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
    orders: [],
    addresses: [],
    reviews: [],
    subscription: null,
    loading: false,
    error: null
  })
}));

export default useClientStore;