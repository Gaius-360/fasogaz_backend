// ==========================================
// FICHIER: routes/addressRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(protect);

// Routes CRUD
router.post('/', addressController.createAddress);
router.get('/', addressController.getMyAddresses);
router.get('/:id', addressController.getAddressById);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.put('/:id/set-default', addressController.setDefaultAddress);

module.exports = router;