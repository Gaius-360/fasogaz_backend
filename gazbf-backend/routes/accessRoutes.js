// ==========================================
// FICHIER: routes/accessRoutes.js
// Routes pour la gestion des accès 24h (clients)
// ==========================================

const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');
const { protect } = require('../middleware/auth');

// ==========================================
// ROUTES PUBLIQUES
// ==========================================

// Obtenir la tarification (prix de l'accès 24h)
router.get('/pricing', accessController.getPricing);

// ==========================================
// ROUTES PROTÉGÉES (CLIENT UNIQUEMENT)
// ==========================================

router.use(protect); // Toutes les routes suivantes nécessitent authentification

// Middleware pour vérifier que l'utilisateur est un client
const clientOnly = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux clients uniquement'
    });
  }
  next();
};

router.use(clientOnly);

// Vérifier le statut d'accès actuel
router.get('/status', accessController.checkAccessStatus);

// Acheter un accès 24h
router.post('/purchase', accessController.purchaseAccess);

// Historique des achats
router.get('/history', accessController.getAccessHistory);

// Statistiques d'accès
router.get('/stats', accessController.getAccessStats);

module.exports = router;