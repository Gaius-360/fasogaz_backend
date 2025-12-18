// ==========================================
// FICHIER: routes/subscriptionRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Routes publiques
router.get('/plans', subscriptionController.getPlans);

// Routes protégées
router.post('/', protect, subscriptionController.createSubscription);
router.post('/confirm-payment', protect, subscriptionController.confirmPayment);
router.get('/my-subscription', protect, subscriptionController.getMySubscription);
router.get('/transactions', protect, subscriptionController.getMyTransactions);
router.put('/cancel-auto-renew', protect, subscriptionController.cancelAutoRenew);
router.put('/enable-auto-renew', protect, subscriptionController.enableAutoRenew);

module.exports = router;