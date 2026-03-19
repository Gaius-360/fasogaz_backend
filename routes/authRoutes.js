// ==========================================
// FICHIER: routes/authRoutes.js
// ✅ Rate limiting appliqué sur chaque endpoint sensible
// ✅ NOUVEAU: route POST /refresh pour le refresh token silencieux
// ==========================================

const express = require('express');
const router  = express.Router();

const {
  register, login, verifyOTP, resendOTP,
  forgotPassword, resetPassword, getMe,
  updateProfile, changePassword, updateDeliverySettings,
  deleteAccount, requestAccountDeletion, cancelAccountDeletion,
  refreshToken, // ✅ NOUVEAU
  logout,       // ✅ NOUVEAU
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

const {
  authLoginLimiter, otpLimiter,
  otpVerifyLimiter, registerLimiter,
  refreshLimiter, // ✅ NOUVEAU — rate limiter léger pour le refresh
} = require('../middleware/rateLimiter');

// ==========================================
// ROUTES PUBLIQUES avec rate limiting
// ==========================================
router.post('/register',        registerLimiter,   register);
router.post('/login',           authLoginLimiter,  login);
router.post('/forgot-password', otpLimiter,        forgotPassword);
router.post('/resend-otp',      otpLimiter,        resendOTP);
router.post('/verify-otp',      otpVerifyLimiter,  verifyOTP);
router.post('/reset-password',  otpVerifyLimiter,  resetPassword);

// ✅ NOUVEAU — Rafraîchissement silencieux du token (cookie httpOnly requis)
// Rate limit très souple : 60 req / 15 min (le client ne devrait appeler
// cette route qu'une seule fois toutes les ~15 min de façon automatique)
router.post('/refresh', refreshLimiter, refreshToken);

// ✅ NOUVEAU — Déconnexion propre (efface le cookie côté serveur)
router.post('/logout', logout);

// ==========================================
// ROUTES PRIVÉES
// ==========================================
router.get('/me',                        protect, getMe);
router.put('/update-profile',            protect, updateProfile);
router.put('/change-password',           protect, changePassword);
router.put('/update-delivery',           protect, updateDeliverySettings);
router.delete('/delete-account',         protect, deleteAccount);
router.post('/request-account-deletion', protect, requestAccountDeletion);
router.post('/cancel-account-deletion',  protect, cancelAccountDeletion);

module.exports = router;