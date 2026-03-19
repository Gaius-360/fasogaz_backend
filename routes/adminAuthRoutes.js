// ==========================================
// FICHIER: routes/adminAuthRoutes.js
// ✅ Rate limiting strict sur le login admin
// ==========================================

const express = require('express');
const router  = express.Router();

const { login, getProfile, changePassword } = require('../controllers/adminAuthController');
const { protectAdmin }    = require('../middleware/adminAuth');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

// ✅ 5 tentatives max / 15 min
router.post('/login',           adminLoginLimiter, login);
router.get('/profile',          protectAdmin,      getProfile);
router.put('/change-password',  protectAdmin,      changePassword);

module.exports = router;