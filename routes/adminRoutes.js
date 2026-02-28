// ==========================================
// FICHIER: routes/adminRoutes.js (VERSION CORRIGÉE)
// Routes d'administration avec gestion transactions et portefeuille
// ==========================================

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuthController = require('../controllers/adminAuthController');
const adminSettingsController = require('../controllers/adminSettingsController');
const adminWalletController = require('../controllers/adminWalletController');
const transactionController = require('../controllers/transactionController');
const agentController = require('../controllers/agentManagementController'); // ✅ AJOUT
const { protectAdmin } = require('../middleware/adminAuth');

// ============================================
// ROUTES D'AUTHENTIFICATION ADMIN (PUBLIC)
// ============================================
router.post('/auth/login', adminAuthController.login);

// ============================================
// ROUTES PROTÉGÉES (ADMIN SEULEMENT)
// ============================================
router.use(protectAdmin);

// ==========================================
// AUTHENTIFICATION & PROFIL
// ==========================================
router.get('/auth/profile', adminAuthController.getProfile);
router.put('/auth/change-password', adminAuthController.changePassword);

// ==========================================
// STATISTIQUES DASHBOARD
// ==========================================
router.get('/stats/dashboard', adminController.getDashboardStats);
router.get('/stats/revenue', adminController.getRevenueChart);
router.get('/stats/top-sellers', adminController.getTopSellers);

// ==========================================
// GESTION DES UTILISATEURS
// ==========================================
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// ==========================================
// GESTION DES REVENDEURS
// ==========================================
router.get('/sellers', adminController.getAllSellers);
router.get('/sellers/pending', adminController.getPendingSellers);
router.get('/sellers/:id', adminController.getSellerById);
router.put('/sellers/:id/validate', adminController.validateSeller);
router.put('/sellers/:id/reject', adminController.rejectSeller);
router.put('/sellers/:id/suspend', adminController.suspendSeller);
router.put('/sellers/:id/reactivate', adminController.reactivateSeller);
router.delete('/sellers/:id', adminController.deleteSeller);

// ==========================================
// GESTION DES CLIENTS
// ==========================================
router.get('/clients', adminController.getAllClients);
router.get('/clients/:id', adminController.getClientById);
router.put('/clients/:id/block', adminController.blockClient);
router.put('/clients/:id/unblock', adminController.unblockClient);
router.delete('/clients/:id', adminController.deleteClient);

// ==========================================
// GESTION DES AGENTS ✅ DÉPLACÉ ICI (depuis agentManagementRoutes.js)
// ⚠️ Routes spécifiques AVANT les routes avec paramètre /:id
// ==========================================
router.get('/agents', agentController.getAllAgents);
router.post('/agents', agentController.createAgent);
router.get('/agents/:id', agentController.getAgentById);
router.put('/agents/:id/toggle-status', agentController.toggleAgentStatus);
router.put('/agents/:id/regenerate-code', agentController.regenerateAgentCode);
router.put('/agents/:id', agentController.updateAgent);
router.delete('/agents/:id', agentController.deleteAgent);

// ==========================================
// GESTION DES PRODUITS
// ==========================================
router.get('/products', adminController.getAllProducts);
router.delete('/products/:id', adminController.deleteProduct);

// ==========================================
// GESTION DES COMMANDES
// ==========================================
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);

// ==========================================
// GESTION DES ABONNEMENTS
// ==========================================
router.get('/subscriptions', adminController.getAllSubscriptions);
router.get('/subscriptions/expiring', adminController.getExpiringSubscriptions);

// ==========================================
// GESTION DES TRANSACTIONS (UNIFIÉ)
// ✅ CORRECTION: Routes spécifiques AVANT les routes avec paramètres
// ==========================================

// ✅ Routes spécifiques d'abord
router.get('/transactions/stats', transactionController.getTransactionStats);
router.get('/transactions/export', transactionController.exportTransactions);

// ✅ Routes génériques après
router.get('/transactions', transactionController.getAllTransactions);
router.get('/transactions/:id', transactionController.getTransactionById);

// ✅ Actions sur les transactions
router.put('/transactions/:id/validate', transactionController.validateTransaction);
router.put('/transactions/:id/cancel', transactionController.cancelTransaction);

// ==========================================
// PORTEFEUILLE ADMIN
// ==========================================

// Solde et détails
router.get('/wallet/balance', adminWalletController.getWalletBalance);

// Historique des retraits
router.get('/wallet/withdrawals', adminWalletController.getWithdrawals);

// Demander un retrait
router.post('/wallet/withdraw', adminWalletController.requestWithdrawal);

// Statistiques du portefeuille
router.get('/wallet/stats', adminWalletController.getWalletStats);

// ==========================================
// PARAMÈTRES SYSTÈME
// ==========================================
router.get('/settings', adminSettingsController.getSettings);
router.put('/settings', adminSettingsController.updateSettings);

// Tarification
router.get('/settings/pricing', adminSettingsController.getPricing);
router.put('/settings/pricing', adminSettingsController.updatePricing);

// Maintenance
router.post('/settings/maintenance', adminSettingsController.toggleMaintenance);

// ==========================================
// GESTION DES AVIS
// ==========================================
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:id', adminController.deleteReview);

// ==========================================
// NOTIFICATIONS SYSTÈME
// ==========================================
router.post('/notifications/broadcast', adminController.broadcastNotification);

module.exports = router;