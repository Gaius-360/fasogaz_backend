// ==========================================
// FICHIER: routes/reviewRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/seller/:sellerId', reviewController.getSellerReviews);

// Routes protégées - Client
router.post('/', protect, authorize('client'), reviewController.createReview);
router.get('/my-reviews', protect, authorize('client'), reviewController.getMyReviews);
router.put('/:id', protect, authorize('client'), reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);

// Routes protégées - Revendeur
router.get('/received', protect, authorize('revendeur'), reviewController.getReceivedReviews);

// Routes communes
router.post('/:id/report', protect, reviewController.reportReview);

module.exports = router;