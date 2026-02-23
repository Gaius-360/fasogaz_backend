// ==========================================
// FICHIER: routes/authRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Routes protégées
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);

// Gestion du compte
router.delete('/delete-account', protect, authController.deleteAccount);
router.post('/request-account-deletion', protect, authController.requestAccountDeletion);
router.post('/cancel-account-deletion', protect, authController.cancelAccountDeletion);

// Routes spécifiques revendeurs
router.put('/update-delivery', protect, authController.updateDeliverySettings);

module.exports = router;