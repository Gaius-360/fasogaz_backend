// ==========================================
// FICHIER: src/hooks/useAdmin.js
// Hook centralisé pour toutes les opérations admin
// VERSION MISE À JOUR avec graphiques
// ==========================================

import { useState, useCallback } from 'react';
import { api } from '../api/apiSwitch';

export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // HELPER - Wrapper pour gérer loading/error
  // ==========================================
  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Une erreur est survenue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // STATS & GRAPHIQUES
  // ==========================================
  const getDashboardStats = useCallback(() => 
    execute(() => api.adminStats.getDashboardStats()), 
  [execute]);

  const getRevenueChart = useCallback((period) => 
    execute(() => api.adminStats.getRevenueChart(period)), 
  [execute]);

  // Graphique des commandes par jour
  const getOrdersChart = useCallback(async (days = 7) => {
    return execute(async () => {
      try {
        // Calculer les dates
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Récupérer toutes les commandes
        const response = await api.admin?.orders?.getAll?.({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        if (!response?.success) {
          throw new Error('Erreur récupération commandes');
        }

        // Grouper par jour
        const ordersByDay = {};
        const orders = response.data?.orders || [];
        
        // Initialiser tous les jours à 0
        const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          const dayKey = daysOfWeek[date.getDay()];
          ordersByDay[dayKey] = 0;
        }

        // Compter les commandes
        orders.forEach(order => {
          const date = new Date(order.createdAt);
          const dayKey = daysOfWeek[date.getDay()];
          if (ordersByDay[dayKey] !== undefined) {
            ordersByDay[dayKey]++;
          }
        });

        // Convertir en tableau pour le graphique
        const chartData = Object.keys(ordersByDay).map(day => ({
          day: day,
          orders: ordersByDay[day]
        }));

        return { success: true, data: chartData };
      } catch (err) {
        console.error('❌ Erreur graphique commandes:', err);
        return { success: false, data: [] };
      }
    });
  }, [execute]);

  // Graphique croissance utilisateurs
  const getUserGrowthChart = useCallback(async (months = 6) => {
    return execute(async () => {
      try {
        // Générer données pour les derniers mois
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
                            'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        const currentMonth = new Date().getMonth();
        const chartData = [];

        // TODO: Remplacer par vraies données de l'API
        // Pour l'instant, génération de données simulées
        for (let i = months - 1; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          chartData.push({
            month: monthNames[monthIndex],
            clients: Math.floor(Math.random() * 200) + 800,
            sellers: Math.floor(Math.random() * 40) + 40
          });
        }

        return { success: true, data: chartData };
      } catch (err) {
        console.error('❌ Erreur graphique croissance:', err);
        return { success: false, data: [] };
      }
    });
  }, [execute]);

  // Top revendeurs avec revenus réels
 const getTopSellers = useCallback((limit = 5) => 
    execute(() => api.adminStats.getTopSellers(limit)), 
  [execute]);

  // ==========================================
  // WALLET
  // ==========================================
  const getWalletBalance = useCallback(() => 
    execute(() => api.admin.wallet.getBalance()), 
  [execute]);

  const getWithdrawals = useCallback(() => 
    execute(() => api.admin.wallet.getWithdrawals()), 
  [execute]);

  const requestWithdrawal = useCallback((amount, method, details) => 
    execute(() => api.admin.wallet.withdraw(amount, method, details)), 
  [execute]);

  // ==========================================
  // TRANSACTIONS
  // ==========================================
  const getAllTransactions = useCallback((params) => 
    execute(() => api.admin.transactions.getAll(params)), 
  [execute]);

  const getTransactionStats = useCallback((period) => 
    execute(() => api.admin.transactions.getStats(period)), 
  [execute]);

  const validateTransaction = useCallback((id) => 
    execute(() => api.admin.transactions.validate(id)), 
  [execute]);

  // ==========================================
  // SETTINGS
  // ==========================================
  const getSettings = useCallback(() => 
    execute(() => api.admin.settings.get()), 
  [execute]);

  const updateSettings = useCallback((data) => 
    execute(() => api.admin.settings.update(data)), 
  [execute]);

  const getPricing = useCallback(() => 
    execute(() => api.admin.settings.getPricing()), 
  [execute]);

  const updatePricing = useCallback((data) => 
    execute(() => api.admin.settings.updatePricing(data)), 
  [execute]);

  // ==========================================
  // SELLERS
  // ==========================================
  const getAllSellers = useCallback((params) => 
    execute(() => api.admin.sellers.getAll(params)), 
  [execute]);

  const getSellerById = useCallback((id) => 
    execute(() => api.admin.sellers.getById(id)), 
  [execute]);

  const getPendingSellers = useCallback(() => 
    execute(() => api.admin.sellers.getPending()), 
  [execute]);

  const validateSeller = useCallback((id, message) => 
    execute(() => api.admin.sellers.validate(id, message)), 
  [execute]);

  const rejectSeller = useCallback((id, reason, message) => 
    execute(() => api.admin.sellers.reject(id, reason, message)), 
  [execute]);

  const suspendSeller = useCallback((id, reason, duration) => 
    execute(() => api.admin.sellers.suspend(id, reason, duration)), 
  [execute]);

  const reactivateSeller = useCallback((id) => 
    execute(() => api.admin.sellers.reactivate(id)), 
  [execute]);

  const deleteSeller = useCallback((id) => 
    execute(() => api.admin.sellers.delete(id)), 
  [execute]);

  // ==========================================
  // CLIENTS
  // ==========================================
  const getAllClients = useCallback((params) => 
    execute(() => api.admin.clients.getAll(params)), 
  [execute]);

  const getClientById = useCallback((id) => 
    execute(() => api.admin.clients.getById(id)), 
  [execute]);

  const blockClient = useCallback((id, reason) => 
    execute(() => api.admin.clients.block(id, reason)), 
  [execute]);

  const unblockClient = useCallback((id) => 
    execute(() => api.admin.clients.unblock(id)), 
  [execute]);

  const deleteClient = useCallback((id) => 
    execute(() => api.admin.clients.delete(id)), 
  [execute]);

  // ==========================================
  // RETURN
  // ==========================================
  return {
    loading,
    error,
    clearError: () => setError(null),

    // Stats & Graphiques
    getDashboardStats,
    getRevenueChart,
    getOrdersChart,
    getUserGrowthChart,
    getTopSellers,

    // Wallet
    getWalletBalance,
    getWithdrawals,
    requestWithdrawal,

    // Transactions
    getAllTransactions,
    getTransactionStats,
    validateTransaction,

    // Settings
    getSettings,
    updateSettings,
    getPricing,
    updatePricing,

    // Sellers
    getAllSellers,
    getSellerById,
    getPendingSellers,
    validateSeller,
    rejectSeller,
    suspendSeller,
    reactivateSeller,
    deleteSeller,

    // Clients
    getAllClients,
    getClientById,
    blockClient,
    unblockClient,
    deleteClient,
  };
};

export default useAdmin;