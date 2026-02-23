// ==========================================
// FICHIER: routes/pushRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/subscribe',   pushController.subscribe);
router.delete('/unsubscribe', pushController.unsubscribe);
router.get('/status',       pushController.getStatus);

module.exports = router;