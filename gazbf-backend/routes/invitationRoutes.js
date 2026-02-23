// ==========================================
// FICHIER: routes/invitationRoutes.js
// Routes pour gérer les invitations revendeurs
// ✅ CORRIGÉ - Routes compatibles avec server.js
// ==========================================

const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const { protectAdmin } = require('../middleware/adminAuth');
const { protectAgent, protectAdminOrAgent } = require('../middleware/agentAuth');

// ==========================================
// ROUTES PUBLIQUES
// ==========================================

// Vérifier la validité d'un token
// GET /api/invitations/verify/:token
router.get(
  '/verify/:token',
  invitationController.verifyInvitationToken
);

// ==========================================
// ROUTES ADMIN OU AGENT
// ==========================================

// Générer un nouveau lien d'invitation
// POST /api/invitations/generate
router.post(
  '/generate',
  protectAdminOrAgent,
  invitationController.generateInvitationLink
);

// Obtenir mes invitations
// GET /api/invitations/my-invitations
router.get(
  '/my-invitations',
  protectAdminOrAgent,
  invitationController.getMyInvitations
);

// ==========================================
// ROUTES ADMIN UNIQUEMENT
// ==========================================

// Statistiques globales des invitations
// GET /api/invitations/stats
router.get(
  '/stats',
  protectAdmin,
  invitationController.getInvitationStats
);

// Révoquer une invitation
// PUT /api/invitations/:id/revoke
router.put(
  '/:id/revoke',
  protectAdmin,
  invitationController.revokeInvitation
);

module.exports = router;