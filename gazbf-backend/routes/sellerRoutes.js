const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes réservées aux revendeurs
router.use(protect, authorize('revendeur'));

router.get('/orders/received', sellerController.getReceivedOrders);
router.put('/orders/:id/accept', sellerController.acceptOrder);
router.put('/orders/:id/reject', sellerController.rejectOrder);
router.put('/orders/:id/status', sellerController.updateOrderStatus);

module.exports = router;