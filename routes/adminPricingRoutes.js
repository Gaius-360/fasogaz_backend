// ==========================================
// FICHIER: routes/adminPricingRoutes.js
// Routes Admin pour gérer la tarification
// ==========================================

const express = require('express');
const router = express.Router();
const adminPricingController = require('../controllers/adminPricingController');
const { protectAdmin } = require('../middleware/adminAuth');

// Toutes les routes nécessitent l'authentification admin
router.use(protectAdmin);

// ==========================================
// GESTION GLOBALE
// ==========================================

// Obtenir toute la configuration (client + revendeur)
router.get('/', adminPricingController.getAllPricing);

// ==========================================
// CONFIGURATION CLIENT (ACCÈS 24H)
// ==========================================

// Mettre à jour la tarification client
router.put('/client', adminPricingController.updateClientPricing);

// Statistiques des achats d'accès client
router.get('/client/stats', adminPricingController.getClientAccessStats);

// Historique des achats d'accès
router.get('/client/purchases', adminPricingController.getClientAccessPurchases);

// ==========================================
// CONFIGURATION REVENDEUR (ABONNEMENTS)
// ==========================================

// Mettre à jour la tarification revendeur
router.put('/revendeur', adminPricingController.updateRevendeurPricing);

module.exports = router;