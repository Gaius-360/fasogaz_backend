// ==========================================
// FICHIER: routes/authRoutes.js
// ✅ Rate limiting appliqué sur chaque endpoint sensible
// ==========================================

const express = require('express');
const router  = express.Router();

const {
  register, login, verifyOTP, resendOTP,
  forgotPassword, resetPassword, getMe,
  updateProfile, changePassword, updateDeliverySettings,
  deleteAccount, requestAccountDeletion, cancelAccountDeletion
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

const {
  authLoginLimiter, otpLimiter,
  otpVerifyLimiter, registerLimiter
} = require('../middleware/rateLimiter');

// ✅ Routes publiques avec rate limiting
router.post('/register',       registerLimiter,   register);
router.post('/login',          authLoginLimiter,  login);
router.post('/forgot-password',otpLimiter,        forgotPassword);
router.post('/resend-otp',     otpLimiter,        resendOTP);
router.post('/verify-otp',     otpVerifyLimiter,  verifyOTP);
router.post('/reset-password', otpVerifyLimiter,  resetPassword);

// Routes privées
router.get('/me',                         protect, getMe);
router.put('/update-profile',             protect, updateProfile);
router.put('/change-password',            protect, changePassword);
router.put('/update-delivery',            protect, updateDeliverySettings);
router.delete('/delete-account',          protect, deleteAccount);
router.post('/request-account-deletion',  protect, requestAccountDeletion);
router.post('/cancel-account-deletion',   protect, cancelAccountDeletion);

module.exports = router;