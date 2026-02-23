// ==========================================
// FICHIER: middleware/auth.js
// ✅ VERSION COMPLÈTE avec toutes les fonctions
// ==========================================
const jwt = require('jsonwebtoken');
const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const { Op } = require('sequelize');

// ==========================================
// MIDDLEWARE PRINCIPAL: protect
// ==========================================
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ResponseHandler.error(res, 'Non autorisé. Token manquant.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('🔍 Token décodé:', {
      id: decoded.id,
      role: decoded.role,
      phone: decoded.phone
    });

    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Subscription,
          as: 'subscription',
          required: false
        }
      ]
    });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    console.log('✅ Utilisateur authentifié:', {
      id: user.id,
      role: user.role,
      phone: user.phone
    });

    if (!user.isActive) {
      return ResponseHandler.error(res, 'Compte désactivé. Contactez le support.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur middleware protect:', error);
    
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler.error(res, 'Token expiré. Reconnectez-vous.', 401);
    }
    
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler.error(res, 'Token invalide', 401);
    }
    
    return ResponseHandler.error(res, 'Erreur d\'authentification', 500);
  }
};

// ==========================================
// MIDDLEWARE: authorize (vérifier les rôles)
// ==========================================
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseHandler.error(res, 'Utilisateur non authentifié', 401);
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Rôle non autorisé:', {
        userRole: req.user.role,
        requiredRoles: roles
      });
      return ResponseHandler.error(
        res,
        `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`,
        403
      );
    }

    console.log('✅ Rôle autorisé:', req.user.role);
    next();
  };
};

// ==========================================
// MIDDLEWARE: checkSellerAccess
// Vérifier l'accès des revendeurs selon tarification
// ==========================================
exports.checkSellerAccess = async (req, res, next) => {
  try {
    // Si ce n'est pas un revendeur, passer
    if (req.user.role !== 'revendeur') {
      return next();
    }

    console.log('🔐 Vérification accès revendeur:', req.user.id);

    // 1. Récupérer la configuration de tarification
    const pricingConfig = await db.Pricing.findOne({
      where: { targetRole: 'revendeur' }
    });

    // ✅ Si le système est désactivé, ACCÈS GRATUIT
    if (!pricingConfig || !pricingConfig.isActive) {
      console.log('🆓 Système de tarification désactivé - Accès gratuit');
      req.sellerAccessStatus = {
        hasAccess: true,
        type: 'free_unlimited',
        message: 'Accès gratuit illimité'
      };
      return next();
    }

    // 2. Système ACTIF : Vérifier l'abonnement
    const user = await db.User.findByPk(req.user.id);
    const now = new Date();

    console.log('🔍 SELLER ACCESS CHECK:', {
      id: user.id,
      role: user.role,
      freeTrialEndDate: user.freeTrialEndDate,
      subscriptionEndDate: user.subscriptionEndDate,
      gracePeriodEndDate: user.gracePeriodEndDate
    });

    // 3. Vérifier période d'essai
    if (user.freeTrialEndDate && new Date(user.freeTrialEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.freeTrialEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`✅ Période d'essai active - ${daysRemaining} jours restants`);
      req.sellerAccessStatus = {
        hasAccess: true,
        type: 'free_trial',
        endDate: user.freeTrialEndDate,
        daysRemaining,
        message: `Période d'essai - ${daysRemaining} jours restants`
      };
      return next();
    }

    // 4. Vérifier abonnement actif
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.subscriptionEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`✅ Abonnement actif - ${daysRemaining} jours restants`);
      req.sellerAccessStatus = {
        hasAccess: true,
        type: 'active_subscription',
        endDate: user.subscriptionEndDate,
        daysRemaining,
        message: `Abonnement actif - ${daysRemaining} jours restants`
      };
      return next();
    }

    // 5. Vérifier période de grâce
    if (user.gracePeriodEndDate && new Date(user.gracePeriodEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.gracePeriodEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`⚠️ Période de grâce - ${daysRemaining} jours restants`);
      req.sellerAccessStatus = {
        hasAccess: true,
        type: 'grace_period',
        endDate: user.gracePeriodEndDate,
        daysRemaining,
        message: `Période de grâce - ${daysRemaining} jours restants`,
        warning: 'Renouvelez bientôt pour ne pas perdre votre visibilité'
      };
      return next();
    }

    // 6. Aucun accès = BLOQUER
    console.log('❌ Aucun accès actif - Système de tarification ACTIF');
    req.sellerAccessStatus = {
      hasAccess: false,
      type: 'no_access',
      message: 'Abonnement requis',
      freeTrialDays: pricingConfig.freeTrialDays,
      plans: pricingConfig.plans
    };

    return res.status(403).json({
      success: false,
      message: '🔒 Abonnement requis',
      details: 'Votre abonnement a expiré. Souscrivez pour continuer.',
      accessStatus: req.sellerAccessStatus,
      redirectTo: '/seller/subscription'
    });

  } catch (error) {
    console.error('❌ Erreur middleware checkSellerAccess:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'accès'
    });
  }
};

// ==========================================
// MIDDLEWARE: getAccessStatus
// Obtenir le statut d'accès sans bloquer
// ==========================================
exports.getAccessStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'revendeur') {
      return next();
    }

    const pricingConfig = await db.Pricing.findOne({
      where: { targetRole: 'revendeur' }
    });

    // Système désactivé = accès gratuit
    if (!pricingConfig || !pricingConfig.isActive) {
      req.sellerAccessStatus = {
        hasAccess: true,
        type: 'free_unlimited'
      };
      return next();
    }

    const user = await db.User.findByPk(req.user.id);
    const now = new Date();

    // Période d'essai
    if (user.freeTrialEndDate && new Date(user.freeTrialEndDate) > now) {
      req.sellerAccessStatus = {
        hasAccess: true,
        type: 'free_trial',
        endDate: user.freeTrialEndDate,
        daysRemaining: Math.ceil((new Date(user.freeTrialEndDate) - now) / (1000 * 60 * 60 * 24))
      };
      return next();
    }

    // Abonnement actif
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now) {
      req.sellerAccessStatus = {
        hasAccess: true,
        type: 'active_subscription',
        endDate: user.subscriptionEndDate,
        daysRemaining: Math.ceil((new Date(user.subscriptionEndDate) - now) / (1000 * 60 * 60 * 24))
      };
      return next();
    }

    // Période de grâce
    if (user.gracePeriodEndDate && new Date(user.gracePeriodEndDate) > now) {
      req.sellerAccessStatus = {
        hasAccess: true,
        type: 'grace_period',
        endDate: user.gracePeriodEndDate,
        daysRemaining: Math.ceil((new Date(user.gracePeriodEndDate) - now) / (1000 * 60 * 60 * 24)),
        warning: true
      };
      return next();
    }

    // Pas d'accès
    req.sellerAccessStatus = {
      hasAccess: false,
      type: 'no_access'
    };
    
    next();

  } catch (error) {
    console.error('❌ Erreur getAccessStatus:', error);
    req.sellerAccessStatus = { hasAccess: false, type: 'error' };
    next();
  }
};

// ==========================================
// MIDDLEWARE: protectSeller (alias de authorize)
// ==========================================
exports.protectSeller = async (req, res, next) => {
  try {
    // Vérifier que c'est un revendeur
    if (req.user.role !== 'revendeur') {
      return ResponseHandler.error(
        res,
        `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`,
        403
      );
    }

    // Vérifier le statut de validation
    if (req.user.validationStatus === 'pending') {
      return ResponseHandler.error(res, 'Compte en attente de validation', 403);
    }

    if (req.user.validationStatus === 'rejected') {
      return ResponseHandler.error(
        res,
        'Compte rejeté. Raison: ' + (req.user.rejectionReason || 'Non spécifiée'),
        403
      );
    }

    console.log('✅ Revendeur autorisé:', req.user.id);
    next();
  } catch (error) {
    console.error('❌ Erreur middleware protectSeller:', error);
    return ResponseHandler.error(res, 'Erreur d\'authentification', 500);
  }
};

// ==========================================
// MIDDLEWARE: protectClient (alias de authorize)
// ==========================================
exports.protectClient = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      return ResponseHandler.error(res, 'Accès réservé aux clients', 403);
    }

    next();
  } catch (error) {
    console.error('❌ Erreur middleware protectClient:', error);
    return ResponseHandler.error(res, 'Erreur d\'authentification', 500);
  }
};

// ==========================================
// MIDDLEWARE: authorizeRoles (alias de authorize)
// ==========================================
exports.authorizeRoles = (...roles) => {
  return exports.authorize(...roles);
};