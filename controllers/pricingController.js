// ==========================================
// FICHIER: controllers/pricingController.js
// ✅ REFONTE: Expose les plans d'abonnement (client ET revendeur)
//    Ajout: maxSellersWithoutSubscription pour le client
// ==========================================

const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');

/**
 * @desc    Config de tarification clients (plans d'abonnement)
 * @route   GET /api/pricing/client
 * @access  Public
 */
exports.getClientPricingConfig = async (req, res) => {
  try {
    const config = await db.Pricing.findOne({ where: { targetRole: 'client' } });

    if (!config) {
      return ResponseHandler.success(res, 'Configuration par défaut', {
        isActive:                     false,
        maxSellersWithoutSubscription: null,
        plans:                        {},
        options:                      {}
      });
    }

    // Filtrer uniquement les plans activés pour la réponse publique
    const enabledPlans = config.isActive
      ? Object.fromEntries(Object.entries(config.plans || {}).filter(([, p]) => p.enabled))
      : {};

    return ResponseHandler.success(res, 'Configuration récupérée', {
      isActive:                     config.isActive,
      maxSellersWithoutSubscription: config.isActive ? 5 : null,
      plans:                        enabledPlans,
      options:                      config.options || {}
    });

  } catch (error) {
    console.error('❌ Erreur récupération config client:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

/**
 * @desc    Config de tarification revendeurs (plans d'abonnement)
 * @route   GET /api/pricing/revendeur
 * @access  Public
 */
exports.getSellerPricingConfig = async (req, res) => {
  try {
    const config = await db.Pricing.findOne({ where: { targetRole: 'revendeur' } });

    if (!config) {
      return ResponseHandler.success(res, 'Configuration par défaut', {
        isActive:      false,
        freeTrialDays: 0,
        plans:         {},
        options:       {}
      });
    }

    return ResponseHandler.success(res, 'Configuration récupérée', {
      isActive:      config.isActive,
      freeTrialDays: config.freeTrialDays || 0,
      plans:         config.plans || {},
      options:       config.options || {}
    });

  } catch (error) {
    console.error('❌ Erreur récupération config revendeur:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

/**
 * @desc    Config de tarification pour l'utilisateur connecté
 * @route   GET /api/pricing/my-config
 * @access  Private
 */
exports.getMyPricingConfig = async (req, res) => {
  try {
    const targetRole = req.user.role === 'revendeur' ? 'revendeur' : 'client';

    const config = await db.Pricing.findOne({ where: { targetRole } });

    if (!config) {
      return ResponseHandler.success(res, 'Configuration par défaut', {
        isActive:      false,
        freeTrialDays: 0,
        plans:         {},
        options:       {}
      });
    }

    const base = {
      isActive: config.isActive,
      plans:    config.plans || {},
      options:  config.options || {}
    };

    if (targetRole === 'client') {
      return ResponseHandler.success(res, 'Configuration récupérée', {
        ...base,
        maxSellersWithoutSubscription: config.isActive ? 5 : null
      });
    }

    // revendeur
    return ResponseHandler.success(res, 'Configuration récupérée', {
      ...base,
      freeTrialDays: config.freeTrialDays || 0
    });

  } catch (error) {
    console.error('❌ Erreur récupération config:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};