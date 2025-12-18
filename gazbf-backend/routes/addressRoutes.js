// ==========================================
// FICHIER: routes/addressRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes sont protégées et réservées aux clients
router.use(protect, authorize('client'));

router.post('/', addressController.createAddress);
router.get('/', addressController.getMyAddresses);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;