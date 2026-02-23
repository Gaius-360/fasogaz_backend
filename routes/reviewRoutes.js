// ==========================================
// FICHIER: routes/reviewRoutes.js (VERSION AVEC CONTRÔLE D'ACCÈS)
// ==========================================
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { 
  protect, 
  authorize, 
  checkSellerAccess 
} = require('../middleware/auth');

// ==========================================
// ROUTES PUBLIQUES
// ==========================================
router.get(
  '/seller/:sellerId',
  reviewController.getSellerReviews
);

// ==========================================
// ROUTES PROTÉGÉES - CLIENT
// ==========================================
router.post(
  '/',
  protect,
  authorize('client'),
  reviewController.createReview
);

router.get(
  '/my-reviews',
  protect,
  authorize('client'),
  reviewController.getMyReviews
);

// ==========================================
// ROUTES PROTÉGÉES - REVENDEUR
// (Nécessitent abonnement actif)
// ==========================================

// Obtenir les avis reçus - Nécessite abonnement actif
router.get(
  '/received',
  protect,
  authorize('revendeur'),
  checkSellerAccess, // ✅ NOUVEAU : Vérifier l'abonnement actif
  reviewController.getReceivedReviews
);

// Répondre à un avis - Nécessite abonnement actif
router.put(
  '/:id/respond',
  protect,
  authorize('revendeur'),
  checkSellerAccess, // ✅ NOUVEAU : Vérifier l'abonnement actif
  reviewController.respondToReview
);

module.exports = router;