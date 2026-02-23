// ==========================================
// FICHIER: routes/agentManagementRoutes.js
// Routes de gestion des agents (ADMIN UNIQUEMENT)
// ==========================================

const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentManagementController');
const { protectAdmin } = require('../middleware/adminAuth');

// ==========================================
// TOUTES LES ROUTES NÉCESSITENT LES DROITS ADMIN
// ==========================================
router.use(protectAdmin);

/**
 * @route   POST /api/admin/agents
 * @desc    Créer un nouvel agent (génère code automatiquement)
 * @access  Private (Admin)
 * @body    { phone, firstName, lastName, email?, agentZone }
 */
router.post('/', agentController.createAgent);

/**
 * @route   GET /api/admin/agents
 * @desc    Obtenir la liste de tous les agents
 * @access  Private (Admin)
 * @query   { isActive?, agentZone?, page?, limit? }
 */
router.get('/', agentController.getAllAgents);

/**
 * @route   GET /api/admin/agents/:id
 * @desc    Obtenir les détails d'un agent
 * @access  Private (Admin)
 */
router.get('/:id', agentController.getAgentById);

/**
 * @route   PUT /api/admin/agents/:id
 * @desc    Mettre à jour un agent
 * @access  Private (Admin)
 * @body    { firstName?, lastName?, email?, agentZone?, isAgentActive? }
 */
router.put('/:id', agentController.updateAgent);

/**
 * @route   PUT /api/admin/agents/:id/toggle-status
 * @desc    Activer/Désactiver un agent
 * @access  Private (Admin)
 */
router.put('/:id/toggle-status', agentController.toggleAgentStatus);

/**
 * @route   PUT /api/admin/agents/:id/regenerate-code
 * @desc    Régénérer le code d'un agent (ancien code devient invalide)
 * @access  Private (Admin)
 */
router.put('/:id/regenerate-code', agentController.regenerateAgentCode);

/**
 * @route   DELETE /api/admin/agents/:id
 * @desc    Supprimer un agent (impossible s'il a des invitations actives)
 * @access  Private (Admin)
 */
router.delete('/:id', agentController.deleteAgent);

module.exports = router;