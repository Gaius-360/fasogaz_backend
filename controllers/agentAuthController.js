// ==========================================
// FICHIER: controllers/agentAuthController.js
// Contrôleur d'authentification pour les agents terrain
// ✅ CORRECTION: Vérifier seulement isAgentActive
// ==========================================

const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const jwt = require('jsonwebtoken');

/**
 * Générer un token JWT pour un agent
 */
const generateAgentToken = (agentId) => {
  return jwt.sign(
    { id: agentId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

/**
 * Connexion d'un agent avec son code
 * @route   POST /api/agent/auth/login
 * @access  Public
 */
exports.agentLogin = async (req, res) => {
  try {
    const { agentCode } = req.body;

    // Validation
    if (!agentCode) {
      return ResponseHandler.error(
        res,
        'Code agent requis',
        400
      );
    }

    // Vérifier le format
    if (!agentCode.startsWith('AG-')) {
      return ResponseHandler.error(
        res,
        'Format de code invalide. Le code doit commencer par AG-',
        400
      );
    }

    // Rechercher l'agent
    const agent = await db.User.findOne({
      where: {
        agentCode: agentCode.toUpperCase(),
        role: 'agent'
      },
      attributes: { exclude: ['password'] }
    });

    if (!agent) {
      return ResponseHandler.error(
        res,
        'Code agent invalide',
        401
      );
    }

    // ✅ CORRECTION: Vérifier seulement isAgentActive (pas isActive)
    if (!agent.isAgentActive) {
      return ResponseHandler.error(
        res,
        'Compte agent désactivé. Contactez un administrateur.',
        403
      );
    }

    // Vérifier que l'agent est vérifié (si le champ existe)
    if (agent.isVerified === false) {
      return ResponseHandler.error(
        res,
        'Compte non vérifié. Contactez un administrateur.',
        403
      );
    }

    // Générer le token
    const token = generateAgentToken(agent.id);

    console.log(`✅ Agent connecté: ${agent.agentCode} - ${agent.firstName} ${agent.lastName}`);

    // Mettre à jour la dernière connexion
    await agent.update({
      lastLogin: new Date()
    });

    // Récupérer les stats de l'agent
    const totalInvitations = await db.InvitationToken.count({
      where: { generatedBy: agent.id }
    });

    const usedInvitations = await db.InvitationToken.count({
      where: {
        generatedBy: agent.id,
        status: 'used'
      }
    });

    return ResponseHandler.success(
      res,
      'Connexion réussie',
      {
        token,
        agent: {
          id: agent.id,
          agentCode: agent.agentCode,
          firstName: agent.firstName,
          lastName: agent.lastName,
          phone: agent.phone,
          email: agent.email,
          agentZone: agent.agentZone,
          role: agent.role,
          isAgentActive: agent.isAgentActive,
          createdAt: agent.createdAt,
          stats: {
            totalInvitations,
            usedInvitations,
            pendingInvitations: totalInvitations - usedInvitations
          }
        }
      }
    );
  } catch (error) {
    console.error('❌ Erreur login agent:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la connexion',
      500
    );
  }
};

/**
 * Vérifier la validité d'un code agent (pour validation en temps réel)
 * @route   POST /api/agent/auth/verify-code
 * @access  Public
 */
exports.verifyAgentCode = async (req, res) => {
  try {
    const { agentCode } = req.body;

    if (!agentCode || !agentCode.startsWith('AG-')) {
      return ResponseHandler.success(
        res,
        'Code invalide',
        {
          valid: false,
          message: 'Format de code invalide'
        }
      );
    }

    // Rechercher l'agent
    const agent = await db.User.findOne({
      where: {
        agentCode: agentCode.toUpperCase(),
        role: 'agent'
      },
      attributes: ['id', 'isAgentActive', 'isVerified']
    });

    if (!agent) {
      return ResponseHandler.success(
        res,
        'Code invalide',
        {
          valid: false,
          message: 'Code agent non reconnu'
        }
      );
    }

    // ✅ CORRECTION: Vérifier seulement isAgentActive
    if (!agent.isAgentActive) {
      return ResponseHandler.success(
        res,
        'Compte désactivé',
        {
          valid: false,
          message: 'Compte agent désactivé'
        }
      );
    }

    return ResponseHandler.success(
      res,
      'Code valide',
      {
        valid: true,
        message: 'Code agent reconnu'
      }
    );
  } catch (error) {
    console.error('❌ Erreur vérification code:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la vérification',
      500
    );
  }
};

/**
 * Obtenir le profil de l'agent connecté
 * @route   GET /api/agent/auth/profile
 * @access  Private (Agent)
 */
exports.getAgentProfile = async (req, res) => {
  try {
    const agent = req.agent; // Injecté par le middleware protectAgent

    // Récupérer les stats détaillées
    const invitations = await db.InvitationToken.findAll({
      where: { generatedBy: agent.id },
      include: [{
        model: db.User,
        as: 'seller',
        attributes: ['id', 'businessName', 'phone', 'createdAt']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const stats = {
      totalInvitations: invitations.length,
      usedInvitations: invitations.filter(i => i.status === 'used').length,
      activeInvitations: invitations.filter(i => i.status === 'active').length,
      expiredInvitations: invitations.filter(i => i.status === 'expired').length,
      recentInvitations: invitations.slice(0, 5)
    };

    return ResponseHandler.success(
      res,
      'Profil récupéré',
      {
        agent: {
          id: agent.id,
          agentCode: agent.agentCode,
          firstName: agent.firstName,
          lastName: agent.lastName,
          phone: agent.phone,
          email: agent.email,
          agentZone: agent.agentZone,
          isAgentActive: agent.isAgentActive,
          createdAt: agent.createdAt,
          lastLogin: agent.lastLogin
        },
        stats
      }
    );
  } catch (error) {
    console.error('❌ Erreur récupération profil agent:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la récupération',
      500
    );
  }
};

/**
 * Mettre à jour le profil de l'agent
 * @route   PUT /api/agent/auth/profile
 * @access  Private (Agent)
 */
exports.updateAgentProfile = async (req, res) => {
  try {
    const agent = req.agent;
    const { email, phone } = req.body;

    const updates = {};
    
    if (email !== undefined) {
      updates.email = email;
    }
    
    if (phone !== undefined) {
      // Vérifier que le téléphone n'est pas déjà utilisé
      if (phone !== agent.phone) {
        const existingUser = await db.User.findOne({
          where: { phone, id: { [db.Sequelize.Op.ne]: agent.id } }
        });
        
        if (existingUser) {
          return ResponseHandler.error(
            res,
            'Ce numéro est déjà utilisé',
            400
          );
        }
        
        updates.phone = phone;
      }
    }

    await agent.update(updates);

    console.log(`✅ Profil agent ${agent.agentCode} mis à jour`);

    return ResponseHandler.success(
      res,
      'Profil mis à jour avec succès',
      {
        agent: {
          id: agent.id,
          agentCode: agent.agentCode,
          firstName: agent.firstName,
          lastName: agent.lastName,
          phone: agent.phone,
          email: agent.email,
          agentZone: agent.agentZone
        }
      }
    );
  } catch (error) {
    console.error('❌ Erreur mise à jour profil agent:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la mise à jour',
      500
    );
  }
};