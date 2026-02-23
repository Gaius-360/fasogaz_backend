// ==========================================
// FICHIER: routes/sellerAuthRoutes.js
// Routes d'inscription spécifiques aux revendeurs
// ==========================================

const express = require('express');
const router = express.Router();
const sellerRegistrationController = require('../controllers/sellerRegistrationController');

// ==========================================
// INSCRIPTION REVENDEUR VIA TOKEN
// ==========================================

// Inscription avec token d'invitation
router.post(
  '/register-seller',
  sellerRegistrationController.registerSellerWithToken
);

// Vérification OTP après inscription
router.post(
  '/verify-seller-otp',
  sellerRegistrationController.verifySellerOTP
);

// Renvoyer OTP
router.post(
  '/resend-seller-otp',
  sellerRegistrationController.resendSellerOTP
);

module.exports = router;