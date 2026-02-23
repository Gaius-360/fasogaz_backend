// ==========================================
// FICHIER: routes/paymentRoutes.js
// Routes de paiement LigdiCash
// ==========================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const simulationController = require('../controllers/simulationController');
const { protect } = require('../middleware/auth');

// ==========================================
// ROUTES PROTÉGÉES (utilisateur authentifié)
// ==========================================

// Initier un paiement
router.post('/initiate', protect, paymentController.initiatePayment);

// Vérifier le statut d'une transaction
router.get('/status/:transactionNumber', protect, paymentController.checkStatus);

// ==========================================
// ROUTES PUBLIQUES (callbacks LigdiCash)
// ==========================================

// Callback webhook (serveur à serveur)
router.post('/ligdicash/callback', paymentController.handleCallback);

// Retour utilisateur après paiement
router.get('/ligdicash/return', paymentController.handleReturn);

// ==========================================
// ROUTES DE SIMULATION (mode test uniquement)
// ==========================================

if (process.env.LIGDICASH_SIMULATION_MODE === 'true') {
  // Page de simulation
  router.get('/simulation/:token', simulationController.showSimulationPage);
  
  // Compléter une simulation
  router.post('/simulation/:token/complete', simulationController.completeSimulation);
}

module.exports = router;