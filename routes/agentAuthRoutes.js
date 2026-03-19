// ==========================================
// FICHIER: routes/agentAuthRoutes.js
// ✅ Rate limiting sur le login agent
// ==========================================

const express = require('express');
const router  = express.Router();

const {
  agentLogin, verifyAgentCode,
  getAgentProfile, updateAgentProfile
} = require('../controllers/agentAuthController');

const { protectAgent }      = require('../middleware/agentAuth');
const { agentLoginLimiter } = require('../middleware/rateLimiter');

// ✅ 10 tentatives / 15 min
router.post('/login',        agentLoginLimiter, agentLogin);
router.post('/verify-code',  verifyAgentCode);    // lecture seule — pas de secret

router.get('/profile',       protectAgent, getAgentProfile);
router.put('/profile',       protectAgent, updateAgentProfile);

module.exports = router;