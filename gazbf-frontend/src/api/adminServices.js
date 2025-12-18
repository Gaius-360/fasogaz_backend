// ==========================================
// FICHIER: src/api/adminServices.js
// Tous les services pour l'administration
// ==========================================

import api from './axios';

const adminServices = {
  // ============ REVENDEURS ============
  sellers: {
    // Liste tous les revendeurs
    getAll: async (filters = {}) => {
      const response = await api.get('/admin/sellers', { params: filters });
      return response.data;
    },

    // Demandes en attente
    getPending: async () => {
      const response = await api.get('/admin/sellers/pending');
      return response.data;
    },

    // Détails d'un revendeur
    getById: async (id) => {
      const response = await api.get(`/admin/sellers/${id}`);
      return response.data;
    },

    // Valider un revendeur
    validate: async (id, message) => {
      const response = await api.post(`/admin/sellers/${id}/validate`, { message });
      return response.data;
    },

    // Rejeter un revendeur
    reject: async (id, reason, message) => {
      const response = await api.post(`/admin/sellers/${id}/reject`, { reason, message });
      return response.data;
    },

    // Suspendre un revendeur
    suspend: async (id, reason, duration) => {
      const response = await api.post(`/admin/sellers/${id}/suspend`, { reason, duration });
      return response.data;
    },

    // Réactiver un revendeur
    reactivate: async (id) => {
      const response = await api.post(`/admin/sellers/${id}/reactivate`);
      return response.data;
    },

    // Supprimer un revendeur
    delete: async (id) => {
      const response = await api.delete(`/admin/sellers/${id}`);
      return response.data;
    }
  },

  // ============ CLIENTS ============
  clients: {
    // Liste tous les clients
    getAll: async (filters = {}) => {
      const response = await api.get('/admin/clients', { params: filters });
      return response.data;
    },

    // Détails d'un client
    getById: async (id) => {
      const response = await api.get(`/admin/clients/${id}`);
      return response.data;
    },

    // Bloquer un client
    block: async (id, reason) => {
      const response = await api.post(`/admin/clients/${id}/block`, { reason });
      return response.data;
    },

    // Débloquer un client
    unblock: async (id) => {
      const response = await api.post(`/admin/clients/${id}/unblock`);
      return response.data;
    },

    // Supprimer un client
    delete: async (id) => {
      const response = await api.delete(`/admin/clients/${id}`);
      return response.data;
    }
  },

  // ============ COMMANDES ============
  orders: {
    // Liste toutes les commandes
    getAll: async (filters = {}) => {
      const response = await api.get('/admin/orders', { params: filters });
      return response.data;
    },

    // Détails d'une commande
    getById: async (id) => {
      const response = await api.get(`/admin/orders/${id}`);
      return response.data;
    },

    // Statistiques des commandes
    getStats: async (period = 'month') => {
      const response = await api.get('/admin/orders/stats', { params: { period } });
      return response.data;
    }
  },

  // ============ TRANSACTIONS ============
  transactions: {
    // Liste toutes les transactions
    getAll: async (filters = {}) => {
      const response = await api.get('/admin/transactions', { params: filters });
      return response.data;
    },

    // Valider une transaction en attente
    validate: async (id) => {
      const response = await api.post(`/admin/transactions/${id}/validate`);
      return response.data;
    },

    // Statistiques financières
    getStats: async (period = 'month') => {
      const response = await api.get('/admin/transactions/stats', { params: { period } });
      return response.data;
    }
  },

  // ============ PORTEFEUILLE ============
  wallet: {
    // Solde et stats
    getBalance: async () => {
      const response = await api.get('/admin/wallet/balance');
      return response.data;
    },

    // Historique des retraits
    getWithdrawals: async () => {
      const response = await api.get('/admin/wallet/withdrawals');
      return response.data;
    },

    // Demander un retrait
    withdraw: async (amount, method, details) => {
      const response = await api.post('/admin/wallet/withdraw', { amount, method, details });
      return response.data;
    }
  },

  // ============ PARAMÈTRES ============
  settings: {
    // Obtenir les paramètres
    get: async () => {
      const response = await api.get('/admin/settings');
      return response.data;
    },

    // Mettre à jour les paramètres
    update: async (settings) => {
      const response = await api.put('/admin/settings', settings);
      return response.data;
    },

    // Obtenir les tarifs
    getPricing: async () => {
      const response = await api.get('/admin/settings/pricing');
      return response.data;
    },

    // Mettre à jour les tarifs
    updatePricing: async (pricing) => {
      const response = await api.put('/admin/settings/pricing', pricing);
      return response.data;
    }
  }
};

export default adminServices;