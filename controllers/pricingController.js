// ==========================================
// FICHIER: controllers/pricingController.js
// Contrôleur pour exposer la tarification
// ==========================================

const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');

/**
 * @desc    Obtenir la configuration de tarification pour les clients
 * @route   GET /api/pricing/client
 * @access  Public
 */
exports.getClientPricingConfig = async (req, res) => {
  try {
    const config = await db.Pricing.findOne({
      where: { targetRole: 'client' }
    });

    if (!config) {
      return ResponseHandler.success(
        res,
        'Configuration par défaut',
        {
          isActive: false,
          freeTrialDays: 0,
          plans: {}
        }
      );
    }

    return ResponseHandler.success(
      res,
      'Configuration récupérée',
      {
        isActive: config.isActive,
        freeTrialDays: config.freeTrialDays,
        plans: config.plans,
        options: config.options
      }
    );
  } catch (error) {
    console.error('Erreur récupération config client:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

/**
 * @desc    Obtenir la configuration de tarification pour les revendeurs
 * @route   GET /api/pricing/seller
 * @access  Public
 */
exports.getSellerPricingConfig = async (req, res) => {
  try {
    const config = await db.Pricing.findOne({
      where: { targetRole: 'revendeur' }
    });

    if (!config) {
      return ResponseHandler.success(
        res,
        'Configuration par défaut',
        {
          isActive: false,
          freeTrialDays: 0,
          plans: {}
        }
      );
    }

    return ResponseHandler.success(
      res,
      'Configuration récupérée',
      {
        isActive: config.isActive,
        freeTrialDays: config.freeTrialDays,
        plans: config.plans,
        options: config.options
      }
    );
  } catch (error) {
    console.error('Erreur récupération config revendeur:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

/**
 * @desc    Obtenir la configuration de tarification pour l'utilisateur connecté
 * @route   GET /api/pricing/my-config
 * @access  Private
 */
exports.getMyPricingConfig = async (req, res) => {
  try {
    const targetRole = req.user.role === 'revendeur' ? 'revendeur' : 'client';
    
    const config = await db.Pricing.findOne({
      where: { targetRole }
    });

    if (!config) {
      return ResponseHandler.success(
        res,
        'Configuration par défaut',
        {
          isActive: false,
          freeTrialDays: 0,
          plans: {}
        }
      );
    }

    return ResponseHandler.success(
      res,
      'Configuration récupérée',
      {
        isActive: config.isActive,
        freeTrialDays: config.freeTrialDays,
        plans: config.plans,
        options: config.options
      }
    );
  } catch (error) {
    console.error('Erreur récupération config:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};
