// ==========================================
// FICHIER: controllers/invitationController.js
// Gestion des invitations revendeurs via liens sécurisés
// ✅ CORRIGÉ - Support admin hardcodé
// ==========================================

const crypto = require('crypto');
const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const { Op } = require('sequelize');

/**
 * Configuration admin hardcodé (cohérente avec adminAuth.js)
 */
const ADMIN_CONFIG = {
  id: 'admin-1',
  username: process.env.ADMIN_USERNAME || 'admin',
  role: 'admin'
};

/**
 * Générer un lien d'invitation unique
 * @route   POST /api/invitations/generate
 * @access  Private (Admin ou Agent)
 */
exports.generateInvitationLink = async (req, res) => {
  try {
    const { expiryHours = 168, notes, metadata } = req.body; // 168h = 7 jours par défaut
    const generator = req.user;

    console.log('🔍 Génération invitation - Générateur:', {
      id: generator.id,
      role: generator.role,
      username: generator.username
    });

    // Vérifier que seuls admin et agent peuvent générer
    if (generator.role !== 'admin' && generator.role !== 'agent') {
      return ResponseHandler.error(
        res,
        'Seuls les administrateurs et agents peuvent générer des invitations',
        403
      );
    }

    // Générer un token cryptographiquement sécurisé
    const token = crypto.randomBytes(32).toString('hex');

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours));

    // ✅ CORRECTION: Pour l'admin hardcodé, on utilise NULL au lieu de l'ID
    const generatedById = generator.id === ADMIN_CONFIG.id ? null : generator.id;
    
    console.log('💾 Données à sauvegarder:', {
      generatedById,
      generatorType: generator.role,
      isHardcodedAdmin: generator.id === ADMIN_CONFIG.id
    });

    // Créer l'invitation
    const invitation = await db.InvitationToken.create({
      token,
      generatedBy: generatedById, // ← NULL pour admin hardcodé
      generatorType: generator.role,
      expiresAt,
      notes: notes || null,
      metadata: metadata || {},
      // ✅ Stocker le username de l'admin hardcodé dans metadata
      ...(generator.id === ADMIN_CONFIG.id && {
        metadata: {
          ...metadata,
          generatorUsername: generator.username,
          isHardcodedAdmin: true
        }
      })
    });

    // Mettre à jour les stats de l'agent si applicable
    if (generator.role === 'agent') {
      const stats = generator.agentStats || {
        totalInvitationsSent: 0,
        totalSellersRecruited: 0,
        lastInvitationDate: null
      };

      stats.totalInvitationsSent = (stats.totalInvitationsSent || 0) + 1;
      stats.lastInvitationDate = new Date();

      await generator.update({ agentStats: stats });
    }

    // Construire l'URL complète
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/register-revendeur?token=${token}`;

    console.log(`✅ Invitation générée par ${generator.role} ${generator.username || generator.id}`);

    return ResponseHandler.success(
      res,
      'Lien d\'invitation généré avec succès',
      {
        id: invitation.id,
        token: invitation.token,
        url: invitationUrl,
        expiresAt: invitation.expiresAt,
        generatedBy: {
          id: generator.id,
          name: generator.firstName || generator.username,
          type: generator.role
        }
      },
      201
    );
  } catch (error) {
    console.error('❌ Erreur génération invitation:', error);
    console.error('Stack:', error.stack);
    return ResponseHandler.error(
      res,
      'Erreur lors de la génération du lien',
      500
    );
  }
};

/**
 * Vérifier la validité d'un token d'invitation
 * @route   GET /api/invitations/verify/:token
 * @access  Public
 */
exports.verifyInvitationToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return ResponseHandler.error(res, 'Token requis', 400);
    }

    // Chercher le token
    const invitation = await db.InvitationToken.findOne({
      where: { token },
      include: [
        {
          model: db.User,
          as: 'generator',
          attributes: ['id', 'firstName', 'lastName', 'role', 'agentCode'],
          required: false // ✅ Important: LEFT JOIN car peut être NULL
        }
      ]
    });

    if (!invitation) {
      return ResponseHandler.error(
        res,
        'Lien d\'invitation invalide',
        404
      );
    }

    // Vérifier le statut
    if (invitation.status === 'used') {
      return ResponseHandler.error(
        res,
        'Ce lien a déjà été utilisé',
        400
      );
    }

    if (invitation.status === 'revoked') {
      return ResponseHandler.error(
        res,
        'Ce lien a été révoqué',
        400
      );
    }

    // Vérifier l'expiration
    if (new Date() > new Date(invitation.expiresAt)) {
      await invitation.update({ status: 'expired' });
      return ResponseHandler.error(
        res,
        'Ce lien a expiré',
        400
      );
    }

    // ✅ Gérer le cas de l'admin hardcodé
    let generatorInfo = null;
    
    if (invitation.generator) {
      // C'est un agent ou admin DB
      generatorInfo = {
        name: `${invitation.generator.firstName} ${invitation.generator.lastName}`,
        role: invitation.generator.role
      };
    } else if (invitation.metadata?.isHardcodedAdmin) {
      // C'est l'admin hardcodé
      generatorInfo = {
        name: invitation.metadata.generatorUsername || 'Administrateur',
        role: 'admin'
      };
    }

    // Lien valide
    return ResponseHandler.success(
      res,
      'Lien d\'invitation valide',
      {
        isValid: true,
        expiresAt: invitation.expiresAt,
        generatedBy: generatorInfo
      }
    );
  } catch (error) {
    console.error('❌ Erreur vérification token:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la vérification',
      500
    );
  }
};

/**
 * Obtenir la liste des invitations générées
 * @route   GET /api/invitations/my-invitations
 * @access  Private (Admin ou Agent)
 */
exports.getMyInvitations = async (req, res) => {
  try {
    const user = req.user;
    const { status, page = 1, limit = 20 } = req.query;

    console.log('🔍 getMyInvitations - User:', {
      id: user.id,
      role: user.role,
      isHardcodedAdmin: user.id === ADMIN_CONFIG.id
    });

    const where = {};

    // ✅ Admin hardcodé voit tout, Agent voit seulement les siennes
    if (user.role === 'agent') {
      where.generatedBy = user.id;
    } else if (user.id === ADMIN_CONFIG.id) {
      // Admin hardcodé: voir toutes les invitations
      // Pas de filtre sur generatedBy
    } else {
      // Autre cas (normalement ne devrait pas arriver)
      where.generatedBy = user.id;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: invitations } = await db.InvitationToken.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'generator',
          attributes: ['id', 'firstName', 'lastName', 'role', 'agentCode'],
          required: false // ✅ LEFT JOIN
        },
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName', 'phone', 'createdAt'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // ✅ Enrichir les données pour afficher le générateur correctement
    const enrichedInvitations = invitations.map(inv => {
      const invData = inv.toJSON();
      
      // Si pas de generator (admin hardcodé), récupérer depuis metadata
      if (!invData.generator && invData.metadata?.isHardcodedAdmin) {
        invData.generator = {
          id: ADMIN_CONFIG.id,
          firstName: invData.metadata.generatorUsername || 'Admin',
          lastName: '',
          role: 'admin',
          agentCode: null
        };
      }
      
      return invData;
    });

    // Calculer les stats (en tenant compte de l'admin hardcodé)
    const statsWhere = user.role === 'agent' 
      ? { generatedBy: user.id }
      : user.id === ADMIN_CONFIG.id
        ? {} // Admin voit tout
        : { generatedBy: user.id };

    const stats = {
      total: count,
      active: await db.InvitationToken.count({
        where: { ...statsWhere, status: 'active' }
      }),
      used: await db.InvitationToken.count({
        where: { ...statsWhere, status: 'used' }
      }),
      expired: await db.InvitationToken.count({
        where: { ...statsWhere, status: 'expired' }
      }),
      revoked: await db.InvitationToken.count({
        where: { ...statsWhere, status: 'revoked' }
      })
    };

    return ResponseHandler.success(
      res,
      'Invitations récupérées',
      {
        invitations: enrichedInvitations,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('❌ Erreur récupération invitations:', error);
    console.error('Stack:', error.stack);
    return ResponseHandler.error(
      res,
      'Erreur lors de la récupération',
      500
    );
  }
};

/**
 * Révoquer un lien d'invitation
 * @route   PUT /api/invitations/:id/revoke
 * @access  Private (Admin uniquement)
 */
exports.revokeInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = req.user;

    // Seul un admin peut révoquer
    if (admin.role !== 'admin') {
      return ResponseHandler.error(
        res,
        'Seuls les administrateurs peuvent révoquer des invitations',
        403
      );
    }

    const invitation = await db.InvitationToken.findByPk(id);

    if (!invitation) {
      return ResponseHandler.error(
        res,
        'Invitation non trouvée',
        404
      );
    }

    if (invitation.status === 'used') {
      return ResponseHandler.error(
        res,
        'Impossible de révoquer une invitation déjà utilisée',
        400
      );
    }

    // ✅ Pour admin hardcodé, on stocke l'info dans metadata
    const revokedBy = admin.id === ADMIN_CONFIG.id ? null : admin.id;
    
    await invitation.update({
      status: 'revoked',
      revokedAt: new Date(),
      revokedBy,
      revokedReason: reason,
      metadata: {
        ...invitation.metadata,
        ...(admin.id === ADMIN_CONFIG.id && {
          revokedByUsername: admin.username
        })
      }
    });

    return ResponseHandler.success(
      res,
      'Invitation révoquée avec succès'
    );
  } catch (error) {
    console.error('❌ Erreur révocation invitation:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la révocation',
      500
    );
  }
};

/**
 * Obtenir les statistiques des invitations
 * @route   GET /api/invitations/stats
 * @access  Private (Admin uniquement)
 */
exports.getInvitationStats = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let startDate = new Date();
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    }

    // Stats globales
    const totalGenerated = await db.InvitationToken.count();
    const totalUsed = await db.InvitationToken.count({ where: { status: 'used' } });
    const totalActive = await db.InvitationToken.count({ where: { status: 'active' } });
    const totalExpired = await db.InvitationToken.count({ where: { status: 'expired' } });

    // Stats par période
    const periodGenerated = await db.InvitationToken.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });

    const periodUsed = await db.InvitationToken.count({
      where: {
        status: 'used',
        usedAt: { [Op.gte]: startDate }
      }
    });

    // Taux de conversion
    const conversionRate = totalGenerated > 0
      ? ((totalUsed / totalGenerated) * 100).toFixed(1)
      : 0;

    // ✅ Top agents (exclure les invitations de l'admin hardcodé)
    const topAgentsData = await db.InvitationToken.findAll({
      where: { 
        generatorType: 'agent', 
        status: 'used',
        generatedBy: { [Op.ne]: null } // ✅ Exclure NULL (admin hardcodé)
      },
      attributes: [
        'generatedBy',
        [db.sequelize.fn('COUNT', db.sequelize.col('InvitationToken.id')), 'recruitCount']
      ],
      include: [{
        model: db.User,
        as: 'generator',
        attributes: ['id', 'firstName', 'lastName', 'agentCode'],
        required: true // INNER JOIN
      }],
      group: ['generatedBy', 'generator.id'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('InvitationToken.id')), 'DESC']],
      limit: 5,
      raw: false,
      subQuery: false
    });

    const topAgents = topAgentsData.map(item => ({
      agent: item.generator,
      recruits: parseInt(item.get('recruitCount'))
    }));

    const stats = {
      global: {
        totalGenerated,
        totalUsed,
        totalActive,
        totalExpired,
        conversionRate: parseFloat(conversionRate)
      },
      period: {
        generated: periodGenerated,
        used: periodUsed,
        days: period.replace('days', '')
      },
      topAgents
    };

    return ResponseHandler.success(
      res,
      'Statistiques récupérées',
      stats
    );
  } catch (error) {
    console.error('❌ Erreur stats invitations:', error);
    console.error('Stack:', error.stack);
    return ResponseHandler.error(
      res,
      'Erreur lors de la récupération des statistiques',
      500
    );
  }
};

module.exports = exports;