// ==========================================
// FICHIER: routes/paymentRoutes.js
// Routes de paiement LigdiCash
// ✅ FIX: Header CORS explicite sur /simulation/:token/complete
//    La page simulation est servie par le backend (origin = http://localhost:5000)
//    → il faut l'autoriser explicitement sur cette route interne
// ==========================================

const express = require('express');
const router  = express.Router();
const paymentController    = require('../controllers/paymentController');
const simulationController = require('../controllers/simulationController');
const { protect } = require('../middleware/auth');

// ==========================================
// ROUTES PROTÉGÉES (utilisateur authentifié)
// ==========================================

// Initier un paiement
router.post('/initiate', protect, paymentController.initiatePayment);

// ✅ FIX: Vérifier le statut d'une transaction — PUBLIC
//    Seuls status, amount et completedAt sont retournés (pas de données perso)
//    Nécessaire car le JWT peut expirer pendant la redirection LigdiCash
router.get('/status/:transactionNumber', paymentController.checkStatus);

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

  // Page de simulation (GET) — servie depuis le backend, pas de CORS nécessaire
  router.get('/simulation/:token', simulationController.showSimulationPage);

  // Compléter une simulation (POST depuis la page HTML servie par le backend)
  // ✅ FIX CORS: cette route est appelée depuis origin = http://localhost:5000
  //    On ajoute un middleware local pour autoriser explicitement cette origine
  router.post(
    '/simulation/:token/complete',
    (req, res, next) => {
      const origin = req.headers.origin;
      // Autoriser le backend lui-même (page simulation) + absence d'origin (curl/Postman)
      if (!origin || origin === `http://localhost:${process.env.PORT || 5000}` || origin === process.env.BACKEND_URL) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      next();
    },
    simulationController.completeSimulation
  );

  // Preflight OPTIONS pour /simulation/:token/complete
  router.options('/simulation/:token/complete', (req, res) => {
    const origin = req.headers.origin;
    if (origin) res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
  });
}

module.exports = router;