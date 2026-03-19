// ==========================================
// FICHIER: routes/productRoutes.js
// ✅ AJOUT: optionalAuth sur /search et /seller/:sellerId
//    → req.user disponible si token présent (sans bloquer)
//    → productController peut lire req.user.id pour vérifier l'abonnement
//    → distance calculée et limite maxSellers appliquée correctement
// ==========================================

const express    = require('express');
const router     = express.Router();
const jwt        = require('jsonwebtoken');
const productController = require('../controllers/productController');
const {
  protect,
  authorize,
  checkSellerAccess
} = require('../middleware/auth');

/**
 * Middleware optionnel : décode le JWT sans bloquer si absent/invalide.
 * Si token valide   → req.user = payload décodé (id, role, etc.)
 * Si token absent   → req.user = undefined, next() quand même
 * Si token invalide → req.user = undefined, next() quand même
 */
const optionalAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token   = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch {
    // Token expiré ou malformé → on ignore silencieusement
  }
  next();
};

// ==========================================
// ROUTES PUBLIQUES (avec auth optionnelle)
// ==========================================

// ✅ optionalAuth permet au backend de :
//    - identifier le client connecté via req.user.id
//    - vérifier son abonnement (subscriptionEndDate)
//    - calculer la distance pour TOUS les sellers
//    - appliquer la limite maxSellers (5 sans abonnement, null avec)
router.get('/search',           optionalAuth, productController.searchProducts);
router.get('/seller/:sellerId', optionalAuth, productController.getSellerProducts);
router.post('/:id/view',                      productController.incrementView);

// ==========================================
// ROUTES PROTÉGÉES — REVENDEUR
// ==========================================

router.post(
  '/',
  protect,
  authorize('revendeur'),
  checkSellerAccess,
  productController.createProduct
);

router.get(
  '/my-products',
  protect,
  authorize('revendeur'),
  checkSellerAccess,
  productController.getMyProducts
);

router.put(
  '/:id',
  protect,
  authorize('revendeur'),
  checkSellerAccess,
  productController.updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize('revendeur'),
  checkSellerAccess,
  productController.deleteProduct
);

module.exports = router;