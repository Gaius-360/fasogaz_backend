// ==========================================
// FICHIER: routes/productRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize, checkSubscription, checkSellerValidation, checkSellerApproved } = require('../middleware/auth');

// Routes publiques
router.get('/search', productController.searchProducts);
router.get('/seller/:sellerId', productController.getSellerProducts);
router.post('/:id/view', productController.incrementView);

// Routes protégées - Revendeur
router.post(
  '/',
  protect,
  authorize('revendeur'),
  checkSellerValidation,
  checkSubscription,
  checkSellerApproved,
  productController.createProduct
);

router.get(
  '/my-products',
  protect,
  authorize('revendeur'),
  productController.getMyProducts
);

router.put(
  '/:id',
  protect,
  authorize('revendeur'),
  productController.updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize('revendeur'),
  productController.deleteProduct
);

module.exports = router;