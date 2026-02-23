// ==========================================
// FICHIER: routes/orderRoutes.js (VERSION AVEC CONTRÔLE D'ACCÈS)
// ==========================================
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { 
  protect, 
  authorize, 
  checkSellerAccess 
} = require('../middleware/auth');

// Toutes les routes nécessitent authentification
router.use(protect);

// ==========================================
// ROUTES CLIENT
// ==========================================
router.post(
  '/',
  authorize('client'),
  orderController.createOrder
);

router.get(
  '/my-orders',
  authorize('client'),
  orderController.getMyOrders
);

router.get(
  '/:id',
  orderController.getOrderById
);

router.put(
  '/:id/cancel',
  authorize('client'),
  orderController.cancelOrder
);

// ==========================================
// ROUTES REVENDEUR
// (Nécessitent abonnement actif)
// ==========================================

// Obtenir les commandes reçues - Nécessite abonnement actif
router.get(
  '/received',
  authorize('revendeur'),
  checkSellerAccess, // ✅ NOUVEAU : Vérifier l'abonnement actif
  orderController.getReceivedOrders
);

// Mettre à jour le statut d'une commande - Nécessite abonnement actif
router.put(
  '/:id/status',
  authorize('revendeur'),
  checkSellerAccess, // ✅ NOUVEAU : Vérifier l'abonnement actif
  orderController.updateOrderStatus
);

module.exports = router;