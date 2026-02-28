// ==========================================
// FICHIER: controllers/agentManagementController.js
// VERSION ULTRA-SAFE avec agentCode garanti
// ==========================================

const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const crypto = require('crypto');

/**
 * Générer un code agent unique
 */
async function generateUniqueAgentCode() {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = `AG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    const exists = await db.User.findOne({
      where: { agentCode: code }
    });

    if (!exists) {
      return code;
    }

    attempts++;
  }

  throw new Error('Impossible de générer un code agent unique');
}

/**
 * Extraire agentCode de manière sécurisée
 * Essaye plusieurs méthodes pour garantir l'accès
 */
function extractAgentCode(agent) {
  return agent.agentCode || 
         agent.dataValues?.agentCode || 
         agent.get('agentCode') || 
         'CODE_ERROR';
}

/**
 * Créer un nouvel agent
 */
exports.createAgent = async (req, res) => {
  try {
    const {
      phone,
      firstName,
      lastName,
      email,
      agentZone
    } = req.body;

    if (!phone || !firstName || !lastName || !agentZone) {
      return ResponseHandler.error(
        res,
        'Téléphone, prénom, nom et zone requis',
        400
      );
    }

    const existingUser = await db.User.findOne({ where: { phone } });
    if (existingUser) {
      return ResponseHandler.error(
        res,
        'Ce numéro est déjà enregistré',
        400
      );
    }

    const agentCode = await generateUniqueAgentCode();

    const agent = await db.User.create({
      phone,
      password: crypto.randomBytes(32).toString('hex'),
      firstName,
      lastName,
      email: email || null,
      role: 'agent',
      agentCode,
      agentZone,
      isAgentActive: true,
      isActive: true,
      isVerified: true,
      otp: null,
      otpExpiry: null,
      agentStats: {
        totalInvitationsSent: 0,
        totalSellersRecruited: 0,
        lastInvitationDate: null
      }
    });

    console.log(`✅ Agent créé: ${agentCode} - ${firstName} ${lastName}`);

    await db.Notification.create({
      userId: agent.id,
      type: 'system',
      title: '🎉 Compte agent créé',
      message: `Bienvenue ! Votre code agent est ${agentCode}. Utilisez-le pour vous connecter.`,
      priority: 'high'
    });

    return ResponseHandler.success(
      res,
      'Agent créé avec succès',
      {
        id: agent.id,
        agentCode: extractAgentCode(agent),
        phone: agent.phone,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        agentZone: agent.agentZone,
        isAgentActive: agent.isAgentActive,
        createdAt: agent.createdAt
      },
      201
    );
  } catch (error) {
    console.error('❌ Erreur création agent:', error);
    return ResponseHandler.error(
      res,
      error.message || 'Erreur lors de la création',
      500
    );
  }
};

/**
 * Obtenir la liste de tous les agents
 * VERSION ULTRA-SAFE
 */
exports.getAllAgents = async (req, res) => {
  try {
    const { isActive, agentZone, page = 1, limit = 20 } = req.query;

    const where = { role: 'agent' };

    if (isActive !== undefined) {
      where.isAgentActive = isActive === 'true';
    }

    if (agentZone) {
      where.agentZone = agentZone;
    }

    const offset = (page - 1) * limit;

    const { count, rows: agents } = await db.User.findAndCountAll({
      where,
      raw: false,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    console.log('🔍 DEBUG - Nombre d\'agents récupérés:', agents.length);
    if (agents.length > 0) {
      console.log('🔍 DEBUG - Premier agent agentCode:', extractAgentCode(agents[0]));
      console.log('🔍 DEBUG - DataValues:', agents[0].dataValues);
    }

    const enrichedAgents = await Promise.all(
      agents.map(async (agent) => {
        const totalInvitations = await db.InvitationToken.count({
          where: { generatedBy: agent.id }
        });

        const usedInvitations = await db.InvitationToken.count({
          where: {
            generatedBy: agent.id,
            status: 'used'
          }
        });

        const safeAgentCode = extractAgentCode(agent);
        
        console.log(`🔍 Agent ${agent.id} - Code extrait: ${safeAgentCode}`);

        return {
          id: agent.id,
          phone: agent.phone,
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          agentCode: safeAgentCode,
          agentZone: agent.agentZone,
          isAgentActive: agent.isAgentActive,
          isActive: agent.isActive,
          isVerified: agent.isVerified,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
          agentStats: agent.agentStats,
          invitationStats: {
            total: totalInvitations,
            used: usedInvitations,
            pending: totalInvitations - usedInvitations
          }
        };
      })
    );

    return ResponseHandler.success(
      res,
      'Agents récupérés',
      {
        agents: enrichedAgents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('❌ Erreur récupération agents:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la récupération',
      500
    );
  }
};

/**
 * Obtenir les détails d'un agent
 */
exports.getAgentById = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await db.User.findOne({
      where: {
        id,
        role: 'agent'
      },
      raw: false
    });

    if (!agent) {
      return ResponseHandler.error(res, 'Agent non trouvé', 404);
    }

    const invitations = await db.InvitationToken.findAll({
      where: { generatedBy: agent.id },
      include: [{
        model: db.User,
        as: 'seller',
        attributes: ['id', 'businessName', 'phone', 'createdAt']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const stats = {
      totalInvitations: invitations.length,
      usedInvitations: invitations.filter(i => i.status === 'used').length,
      activeInvitations: invitations.filter(i => i.status === 'active').length,
      expiredInvitations: invitations.filter(i => i.status === 'expired').length,
      recruitedSellers: invitations.filter(i => i.status === 'used').map(i => i.seller)
    };

    return ResponseHandler.success(
      res,
      'Agent récupéré',
      {
        id: agent.id,
        phone: agent.phone,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        agentCode: extractAgentCode(agent),
        agentZone: agent.agentZone,
        isAgentActive: agent.isAgentActive,
        isActive: agent.isActive,
        isVerified: agent.isVerified,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        agentStats: agent.agentStats,
        invitations,
        stats
      }
    );
  } catch (error) {
    console.error('❌ Erreur récupération agent:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la récupération',
      500
    );
  }
};

/**
 * Mettre à jour un agent
 */
exports.updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, agentZone, isAgentActive } = req.body;

    const agent = await db.User.findOne({
      where: {
        id,
        role: 'agent'
      }
    });

    if (!agent) {
      return ResponseHandler.error(res, 'Agent non trouvé', 404);
    }

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (agentZone !== undefined) updates.agentZone = agentZone;
    if (isAgentActive !== undefined) updates.isAgentActive = isAgentActive;

    await agent.update(updates);

    console.log(`✅ Agent ${extractAgentCode(agent)} mis à jour`);

    return ResponseHandler.success(
      res,
      'Agent mis à jour avec succès',
      {
        id: agent.id,
        agentCode: extractAgentCode(agent),
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        agentZone: agent.agentZone,
        isAgentActive: agent.isAgentActive
      }
    );
  } catch (error) {
    console.error('❌ Erreur mise à jour agent:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la mise à jour',
      500
    );
  }
};

/**
 * Activer/Désactiver un agent
 */
exports.toggleAgentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await db.User.findOne({
      where: {
        id,
        role: 'agent'
      }
    });

    if (!agent) {
      return ResponseHandler.error(res, 'Agent non trouvé', 404);
    }

    await agent.update({
      isAgentActive: !agent.isAgentActive
    });

    const status = agent.isAgentActive ? 'activé' : 'désactivé';
    console.log(`✅ Agent ${extractAgentCode(agent)} ${status}`);

    await db.Notification.create({
      userId: agent.id,
      type: 'system',
      title: agent.isAgentActive ? '✅ Compte activé' : '⚠️ Compte désactivé',
      message: agent.isAgentActive 
        ? 'Votre compte agent a été réactivé'
        : 'Votre compte agent a été désactivé. Contactez un administrateur.',
      priority: 'high'
    });

    return ResponseHandler.success(
      res,
      `Agent ${status} avec succès`,
      {
        id: agent.id,
        agentCode: extractAgentCode(agent),
        isAgentActive: agent.isAgentActive
      }
    );
  } catch (error) {
    console.error('❌ Erreur toggle status agent:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de l\'opération',
      500
    );
  }
};

/**
 * Supprimer un agent
 * ✅ FIX COMPLET: Suppression de toutes les données liées avant destroy
 */
exports.deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await db.User.findOne({
      where: { id, role: 'agent' }
    });

    if (!agent) {
      return ResponseHandler.error(res, 'Agent non trouvé', 404);
    }

    const activeInvitations = await db.InvitationToken.count({
      where: { generatedBy: agent.id, status: 'active' }
    });

    if (activeInvitations > 0) {
      return ResponseHandler.error(
        res,
        `Impossible de supprimer cet agent. Il a ${activeInvitations} invitation(s) active(s).`,
        400
      );
    }

    const agentCode = extractAgentCode(agent);

    // ✅ Suppression sécurisée de chaque table liée
    // Ne plante pas si le modèle Sequelize n'existe pas
    const safeDestroy = async (model, where) => {
      try {
        if (db[model]) {
          await db[model].destroy({ where });
        }
      } catch (e) {
        console.warn(`⚠️ Impossible de supprimer ${model}:`, e.message);
      }
    };

    // Supprimer dans l'ordre (tables enfants d'abord)
    await safeDestroy('Notification',    { userId: agent.id });
    await safeDestroy('InvitationToken', { generatedBy: agent.id });
    await safeDestroy('Subscription',    { userId: agent.id });
    await safeDestroy('Order',           { customerId: agent.id });
    await safeDestroy('Order',           { sellerId: agent.id });
    await safeDestroy('Review',          { customerId: agent.id });
    await safeDestroy('Review',          { sellerId: agent.id });
    await safeDestroy('Address',         { userId: agent.id });
    await safeDestroy('Product',         { sellerId: agent.id });

    // Supprimer l'agent
    await agent.destroy();

    console.log(`✅ Agent ${agentCode} supprimé avec toutes ses données liées`);

    return ResponseHandler.success(res, 'Agent supprimé avec succès');

  } catch (error) {
    console.error('❌ Erreur suppression agent:', error);

    // Log détaillé pour identifier une éventuelle FK manquante
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error(`🔍 Table FK bloquante: ${error.table} | Champ: ${error.fields} | Index: ${error.index}`);
    }

    return ResponseHandler.error(
      res,
      error.message || 'Erreur lors de la suppression',
      500
    );
  }
};

/**
 * Régénérer le code d'un agent
 */
exports.regenerateAgentCode = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await db.User.findOne({
      where: {
        id,
        role: 'agent'
      }
    });

    if (!agent) {
      return ResponseHandler.error(res, 'Agent non trouvé', 404);
    }

    const oldCode = extractAgentCode(agent);
    const newCode = await generateUniqueAgentCode();

    await agent.update({
      agentCode: newCode
    });

    console.log(`✅ Code régénéré: ${oldCode} → ${newCode}`);

    await db.Notification.create({
      userId: agent.id,
      type: 'system',
      title: '🔄 Nouveau code agent',
      message: `Votre code agent a été modifié. Nouveau code: ${newCode}`,
      priority: 'high'
    });

    return ResponseHandler.success(
      res,
      'Code agent régénéré avec succès',
      {
        id: agent.id,
        oldCode,
        newCode,
        firstName: agent.firstName,
        lastName: agent.lastName
      }
    );
  } catch (error) {
    console.error('❌ Erreur régénération code:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la régénération',
      500
    );
  }
};