// ==========================================
// FICHIER: middleware/checkAccess.js
// ✅ CORRIGÉ: attachAccessInfo ne bloque JAMAIS — laisse toujours passer
//    Le contrôleur searchProducts applique lui-même la limite maxSellers
//    checkClientAccess (bloquant) réservé aux routes strictement payantes
//    Limite sans abonnement : 3 revendeurs
// ==========================================

const { User, Pricing } = require('../models');

/**
 * Middleware NON-BLOQUANT.
 * Attache req.accessInfo et appelle next() dans TOUS les cas.
 * À utiliser sur GET /api/products/search.
 */
const attachAccessInfo = async (req, res, next) => {
  try {
    // Non-clients → accès illimité, pas de calcul
    if (!req.user || req.user.role !== 'client') {
      req.accessInfo = {
        hasAccess:      true,
        accessType:     'unrestricted',
        maxSellers:     null,
        isSystemActive: false
      };
      return next();
    }

    const pricingConfig = await Pricing.findOne({ where: { targetRole: 'client' } });

    // Système désactivé → gratuit illimité
    if (!pricingConfig || !pricingConfig.isActive) {
      req.accessInfo = {
        hasAccess:      true,
        accessType:     'free',
        maxSellers:     null,
        isSystemActive: false
      };
      return next();
    }

    const user = await User.findByPk(req.user.id);
    const now  = new Date();

    // Abonnement actif
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now) {
      const remainingMs   = new Date(user.subscriptionEndDate) - now;
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
      req.accessInfo = {
        hasAccess:      true,
        accessType:     'active',
        maxSellers:     null,
        isSystemActive: true,
        expiresAt:      user.subscriptionEndDate,
        remainingDays
      };
      return next();
    }

    // Période d'essai
    if (user.freeTrialEndDate && new Date(user.freeTrialEndDate) > now) {
      req.accessInfo = {
        hasAccess:      true,
        accessType:     'trial',
        maxSellers:     null,
        isSystemActive: true,
        expiresAt:      user.freeTrialEndDate
      };
      return next();
    }

    // Aucun abonnement → limite à 3 mais on LAISSE PASSER (jamais de 403 ici)
    req.accessInfo = {
      hasAccess:      false,
      accessType:     'none',
      maxSellers:     3,
      isSystemActive: true,
      plans:          pricingConfig.plans || {}
    };
    return next();

  } catch (error) {
    console.error('❌ Erreur attachAccessInfo:', error);
    req.accessInfo = {
      hasAccess:      false,
      accessType:     'error',
      maxSellers:     3,
      isSystemActive: false
    };
    return next();
  }
};

/**
 * Middleware BLOQUANT — NE PAS utiliser sur /products/search.
 * Réservé aux routes qui nécessitent absolument un abonnement actif.
 */
const checkClientAccess = async (req, res, next) => {
  await attachAccessInfo(req, res, () => {
    if (!req.accessInfo.hasAccess) {
      return res.status(403).json({
        success: false,
        requiresSubscription: true,
        message:    'Abonnement requis',
        accessInfo: req.accessInfo
      });
    }
    next();
  });
};

module.exports = { checkClientAccess, attachAccessInfo };