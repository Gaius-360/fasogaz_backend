// ==========================================
// FICHIER: middleware/subscriptionMiddleware.js
// Middleware de vérification d'abonnement robuste
// ==========================================

const { Pricing, Subscription, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Vérifier si l'utilisateur a accès (abonnement ou période gratuite)
 * À utiliser sur les routes nécessitant un abonnement actif
 */
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin = accès toujours autorisé
    if (userRole === 'admin') {
      return next();
    }

    // Récupérer la config de tarification selon le rôle
    const targetRole = userRole === 'revendeur' ? 'revendeur' : 'client';
    const pricingConfig = await Pricing.findOne({
      where: { targetRole }
    });

    // Si le système n'est pas activé = accès gratuit pour tous
    if (!pricingConfig || !pricingConfig.isActive) {
      console.log(`✅ Système désactivé pour ${targetRole} - Accès gratuit`);
      return next();
    }

    // Récupérer l'utilisateur avec ses dates d'abonnement
    const user = await User.findByPk(userId);
    const now = new Date();

    // 1. Vérifier abonnement actif
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now) {
      console.log(`✅ Abonnement actif jusqu'au ${user.subscriptionEndDate}`);
      return next();
    }

    // 2. Vérifier période d'essai gratuite
    if (user.freeTrialEndDate && new Date(user.freeTrialEndDate) > now) {
      console.log(`✅ Période d'essai active jusqu'au ${user.freeTrialEndDate}`);
      return next();
    }

    // 3. Vérifier période de grâce
    if (user.gracePeriodEndDate && new Date(user.gracePeriodEndDate) > now) {
      console.log(`⚠️ Période de grâce active jusqu'au ${user.gracePeriodEndDate}`);
      return next();
    }

    // 4. Aucun accès valide
    console.log(`❌ Accès refusé pour ${user.email} - Abonnement requis`);
    return res.status(403).json({
      success: false,
      message: 'Abonnement requis pour accéder à cette fonctionnalité',
      requiresSubscription: true,
      pricingActive: true
    });

  } catch (error) {
    console.error('❌ Erreur middleware abonnement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'abonnement'
    });
  }
};

/**
 * Initialiser la période d'essai gratuite pour un nouvel utilisateur
 */
const initFreeTrialIfNeeded = async (userId, userRole) => {
  try {
    const targetRole = userRole === 'revendeur' ? 'revendeur' : 'client';
    
    // Récupérer la config
    const pricingConfig = await Pricing.findOne({
      where: { targetRole }
    });

    // Si système désactivé ou pas de période gratuite = rien à faire
    if (!pricingConfig || !pricingConfig.isActive || !pricingConfig.freeTrialDays || pricingConfig.freeTrialDays === 0) {
      console.log(`ℹ️ Pas de période gratuite pour ${targetRole}`);
      return false;
    }

    // Vérifier si l'utilisateur a déjà eu une période gratuite
    const user = await User.findByPk(userId);
    if (user.freeTrialUsed) {
      console.log(`ℹ️ Période gratuite déjà utilisée par ${user.email}`);
      return false;
    }

    // Activer la période gratuite
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pricingConfig.freeTrialDays);

    await user.update({
      freeTrialStartDate: startDate,
      freeTrialEndDate: endDate,
      freeTrialUsed: true,
      hasActiveAccess: true
    });

    console.log(`🎁 Période gratuite activée pour ${user.email}: ${pricingConfig.freeTrialDays} jours`);
    return true;

  } catch (error) {
    console.error('❌ Erreur initialisation période gratuite:', error);
    return false;
  }
};

/**
 * Vérifier le statut d'accès complet de l'utilisateur
 * Retourne: { hasAccess, type, details }
 */
const getAccessStatus = async (userId, userRole) => {
  try {
    const targetRole = userRole === 'revendeur' ? 'revendeur' : 'client';
    
    // Récupérer config et utilisateur
    const [pricingConfig, user] = await Promise.all([
      Pricing.findOne({ where: { targetRole } }),
      User.findByPk(userId)
    ]);

    const now = new Date();

    // Si système désactivé = accès gratuit
    if (!pricingConfig || !pricingConfig.isActive) {
      return {
        hasAccess: true,
        type: 'free_unlimited',
        details: {
          message: 'Accès gratuit illimité'
        }
      };
    }

    // Vérifier abonnement actif
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.subscriptionEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      return {
        hasAccess: true,
        type: 'active_subscription',
        details: {
          endDate: user.subscriptionEndDate,
          daysRemaining,
          autoRenew: user.subscriptionAutoRenew || false
        }
      };
    }

    // Vérifier période d'essai
    if (user.freeTrialEndDate && new Date(user.freeTrialEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.freeTrialEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      return {
        hasAccess: true,
        type: 'free_trial',
        details: {
          endDate: user.freeTrialEndDate,
          daysRemaining,
          totalDays: pricingConfig.freeTrialDays
        }
      };
    }

    // Vérifier période de grâce
    if (user.gracePeriodEndDate && new Date(user.gracePeriodEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.gracePeriodEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      return {
        hasAccess: true,
        type: 'grace_period',
        details: {
          endDate: user.gracePeriodEndDate,
          daysRemaining,
          message: 'Renouvelez maintenant pour ne pas perdre l\'accès'
        }
      };
    }

    // Aucun accès
    return {
      hasAccess: false,
      type: 'no_access',
      details: {
        message: 'Abonnement requis',
        freeTrialUsed: user.freeTrialUsed || false
      }
    };

  } catch (error) {
    console.error('❌ Erreur vérification statut:', error);
    throw error;
  }
};

/**
 * Activer la période de grâce après expiration d'un abonnement
 */
const activateGracePeriod = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    const userRole = user.role === 'revendeur' ? 'revendeur' : 'client';
    
    const pricingConfig = await Pricing.findOne({
      where: { targetRole: userRole }
    });

    if (!pricingConfig || !pricingConfig.options?.gracePeriodDays) {
      console.log('ℹ️ Pas de période de grâce configurée');
      return false;
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pricingConfig.options.gracePeriodDays);

    await user.update({
      gracePeriodEndDate: endDate,
      hasActiveAccess: true
    });

    console.log(`⏰ Période de grâce activée pour ${user.email}: ${pricingConfig.options.gracePeriodDays} jours`);
    return true;

  } catch (error) {
    console.error('❌ Erreur activation période de grâce:', error);
    return false;
  }
};

/**
 * Tâche CRON - Vérifier les abonnements expirés quotidiennement
 */
const checkExpiredSubscriptions = async () => {
  try {
    console.log('🔄 Vérification des abonnements expirés...');
    
    const now = new Date();
    
    // Trouver les utilisateurs avec abonnement expiré
    const expiredUsers = await User.findAll({
      where: {
        subscriptionEndDate: {
          [Op.lt]: now
        },
        gracePeriodEndDate: null, // Pas encore en période de grâce
        hasActiveAccess: true
      }
    });

    console.log(`📋 ${expiredUsers.length} abonnements expirés trouvés`);

    for (const user of expiredUsers) {
      // Activer période de grâce
      await activateGracePeriod(user.id);
      
      // Envoyer notification
      // TODO: Implémenter envoi email/SMS
    }

    // Désactiver l'accès pour les périodes de grâce expirées
    const gracePeriodExpired = await User.findAll({
      where: {
        gracePeriodEndDate: {
          [Op.lt]: now
        },
        hasActiveAccess: true
      }
    });

    for (const user of gracePeriodExpired) {
      await user.update({
        hasActiveAccess: false
      });
      console.log(`🔒 Accès désactivé pour ${user.email}`);
    }

    console.log('✅ Vérification terminée');

  } catch (error) {
    console.error('❌ Erreur vérification abonnements:', error);
  }
};

module.exports = {
  checkSubscription,
  initFreeTrialIfNeeded,
  getAccessStatus,
  activateGracePeriod,
  checkExpiredSubscriptions
};