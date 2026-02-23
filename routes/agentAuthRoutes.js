// ==========================================
// FICHIER: routes/agentAuthRoutes.js
// Routes d'authentification pour les agents terrain
// ==========================================

const express = require('express');
const router = express.Router();
const agentAuthController = require('../controllers/agentAuthController');
const { protectAgent } = require('../middleware/agentAuth');

// ==========================================
// ROUTES PUBLIQUES
// ==========================================

/**
 * @route   POST /api/agent/auth/login
 * @desc    Connexion d'un agent avec son code
 * @access  Public
 * @body    { agentCode: "AG-XXXXXXXX" }
 */
router.post('/login', agentAuthController.agentLogin);

/**
 * @route   POST /api/agent/auth/verify-code
 * @desc    Vérifier la validité d'un code agent (pour le frontend)
 * @access  Public
 * @body    { agentCode: "AG-XXXXXXXX" }
 */
router.post('/verify-code', agentAuthController.verifyAgentCode);

// ==========================================
// ROUTES PROTÉGÉES (Agent authentifié)
// ==========================================

/**
 * @route   GET /api/agent/auth/profile
 * @desc    Obtenir le profil de l'agent connecté avec stats
 * @access  Private (Agent)
 */
router.get('/profile', protectAgent, agentAuthController.getAgentProfile);

/**
 * @route   PUT /api/agent/auth/profile
 * @desc    Mettre à jour le profil de l'agent (email, téléphone)
 * @access  Private (Agent)
 * @body    { email?, phone? }
 */
router.put('/profile', protectAgent, agentAuthController.updateAgentProfile);

module.exports = router;