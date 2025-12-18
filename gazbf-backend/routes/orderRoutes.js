// ==========================================
// FICHIER: routes/orderRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize, checkSubscription } = require('../middleware/auth');

// Routes client
router.post(
  '/',
  protect,
  authorize('client'),
  checkSubscription,
  orderController.createOrder
);

router.get(
  '/my-orders',
  protect,
  authorize('client'),
  orderController.getMyOrders
);

router.put(
  '/:id/cancel',
  protect,
  authorize('client'),
  orderController.cancelOrder
);

// Routes revendeur
router.get(
  '/received',
  protect,
  authorize('revendeur'),
  orderController.getReceivedOrders
);

router.put(
  '/:id/accept',
  protect,
  authorize('revendeur'),
  orderController.acceptOrder
);

router.put(
  '/:id/reject',
  protect,
  authorize('revendeur'),
  orderController.rejectOrder
);

router.put(
  '/:id/status',
  protect,
  authorize('revendeur'),
  orderController.updateOrderStatus
);

// Routes communes
router.get(
  '/:id',
  protect,
  orderController.getOrderById
);

module.exports = router;