// ==========================================
// FICHIER: routes/productRoutes.js (SANS VALIDATION)
// ==========================================
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { 
  protect, 
  authorize, 
  checkSellerAccess
} = require('../middleware/auth');

// ==========================================
// ROUTES PUBLIQUES
// ==========================================
router.get('/search', productController.searchProducts);
router.get('/seller/:sellerId', productController.getSellerProducts);
router.post('/:id/view', productController.incrementView);

// ==========================================
// ROUTES PROTÉGÉES - REVENDEUR
// (Seulement abonnement actif requis)
// ==========================================

// Créer un produit
router.post(
  '/',
  protect,
  authorize('revendeur'),
  checkSellerAccess, // ✅ SEULEMENT vérifier l'abonnement
  productController.createProduct
);

// Obtenir mes produits
router.get(
  '/my-products',
  protect,
  authorize('revendeur'),
  checkSellerAccess,
  productController.getMyProducts
);

// Mettre à jour un produit
router.put(
  '/:id',
  protect,
  authorize('revendeur'),
  checkSellerAccess,
  productController.updateProduct
);

// Supprimer un produit
router.delete(
  '/:id',
  protect,
  authorize('revendeur'),
  checkSellerAccess,
  productController.deleteProduct
);

module.exports = router;