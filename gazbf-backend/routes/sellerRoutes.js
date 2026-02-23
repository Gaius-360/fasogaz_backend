// ==========================================
// FICHIER: routes/sellerRoutes.js (SANS VALIDATION)
// ==========================================
const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { 
  protect, 
  authorize, 
  checkSellerAccess,
  getAccessStatus 
} = require('../middleware/auth');

// ✅ Toutes les routes nécessitent authentification + rôle revendeur
router.use(protect);
router.use(authorize('revendeur'));

// ==========================================
// ROUTES AVEC VÉRIFICATION D'ACCÈS UNIQUEMENT
// ==========================================

// Stats
router.get('/stats', checkSellerAccess, sellerController.getStats);

// Produits
router.get('/products', checkSellerAccess, sellerController.getMyProducts);
router.get('/products/stats', checkSellerAccess, sellerController.getProductsStats);

// Commandes
router.get('/orders', checkSellerAccess, sellerController.getReceivedOrders);
router.get('/orders/stats', checkSellerAccess, sellerController.getOrdersStats);
router.put('/orders/:id/accept', checkSellerAccess, sellerController.acceptOrder);
router.put('/orders/:id/reject', checkSellerAccess, sellerController.rejectOrder);
router.put('/orders/:id/complete', checkSellerAccess, sellerController.completeOrder);

// Avis
router.get('/reviews', checkSellerAccess, sellerController.getReviews);

// ==========================================
// PROFIL - Accessible même sans abonnement
// ==========================================
router.get('/profile', getAccessStatus, sellerController.getProfile);

module.exports = router;