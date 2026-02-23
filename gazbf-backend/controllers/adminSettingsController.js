// ==========================================
// FICHIER: controllers/adminSettingsController.js
// Contrôleur pour la gestion des paramètres système
// ==========================================

const { SystemSettings, Pricing } = require('../models');

/**
 * Récupérer les paramètres généraux
 */
exports.getSettings = async (req, res) => {
  try {
    // Chercher les paramètres (il n'y a qu'une seule ligne)
    let settings = await SystemSettings.findOne();

    // Si pas de paramètres, créer les valeurs par défaut
    if (!settings) {
      settings = await SystemSettings.create({
        platformName: 'GAZBF',
        version: '2.0',
        supportPhone: '',
        supportEmail: '',
        validationDelay: 48,
        autoValidation: false,
        maintenanceMode: false
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erreur récupération paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres',
      error: error.message
    });
  }
};

/**
 * Mettre à jour les paramètres généraux
 */
exports.updateSettings = async (req, res) => {
  try {
    const {
      platformName,
      supportPhone,
      supportEmail,
      validationDelay,
      autoValidation,
      maintenanceMode,
      maintenanceMessage
    } = req.body;

    // Chercher les paramètres existants
    let settings = await SystemSettings.findOne();

    if (!settings) {
      // Créer si n'existe pas
      settings = await SystemSettings.create(req.body);
    } else {
      // Mettre à jour
      await settings.update({
        platformName,
        supportPhone,
        supportEmail,
        validationDelay,
        autoValidation,
        maintenanceMode,
        maintenanceMessage
      });
    }

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data: settings
    });
  } catch (error) {
    console.error('Erreur mise à jour paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres',
      error: error.message
    });
  }
};

/**
 * Récupérer la configuration de tarification
 */
exports.getPricing = async (req, res) => {
  try {
    // Récupérer les configs client et revendeur
    const clientPricing = await Pricing.findOne({
      where: { targetRole: 'client' }
    });

    const revendeurPricing = await Pricing.findOne({
      where: { targetRole: 'revendeur' }
    });

    // Structures par défaut si non existantes
    const defaultConfig = {
      isActive: false,
      freeTrialDays: 0,
      plans: {
        weekly: { price: 0, duration: 7, enabled: false },
        monthly: { price: 0, duration: 30, enabled: false },
        quarterly: { price: 0, duration: 90, enabled: false },
        yearly: { price: 0, duration: 365, enabled: false }
      },
      options: {
        autoRenew: true,
        gracePeriodDays: 3,
        notifyBeforeExpiry: 7
      }
    };

    res.json({
      success: true,
      data: {
        client: clientPricing ? {
          isActive: clientPricing.isActive,
          freeTrialDays: clientPricing.freeTrialDays,
          plans: clientPricing.plans,
          options: clientPricing.options
        } : defaultConfig,
        revendeur: revendeurPricing ? {
          isActive: revendeurPricing.isActive,
          freeTrialDays: revendeurPricing.freeTrialDays,
          plans: revendeurPricing.plans,
          options: revendeurPricing.options
        } : defaultConfig
      }
    });
  } catch (error) {
    console.error('Erreur récupération pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la tarification',
      error: error.message
    });
  }
};

/**
 * Mettre à jour la configuration de tarification
 */
exports.updatePricing = async (req, res) => {
  try {
    const { targetRole, config } = req.body;

    // Validation
    if (!targetRole || !['client', 'revendeur'].includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: 'targetRole invalide. Doit être "client" ou "revendeur"'
      });
    }

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuration manquante'
      });
    }

    // Chercher la config existante
    let pricing = await Pricing.findOne({
      where: { targetRole }
    });

    if (!pricing) {
      // Créer nouvelle config
      pricing = await Pricing.create({
        targetRole,
        isActive: config.isActive || false,
        freeTrialDays: parseInt(config.freeTrialDays) || 0,
        plans: config.plans || {},
        options: config.options || {}
      });
    } else {
      // Mettre à jour
      await pricing.update({
        isActive: config.isActive,
        freeTrialDays: parseInt(config.freeTrialDays) || 0,
        plans: config.plans,
        options: config.options
      });
    }

    res.json({
      success: true,
      message: `Configuration ${targetRole} mise à jour avec succès`,
      data: pricing
    });
  } catch (error) {
    console.error('Erreur mise à jour pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la tarification',
      error: error.message
    });
  }
};

/**
 * Activer/désactiver le mode maintenance
 */
exports.toggleMaintenance = async (req, res) => {
  try {
    const { enabled, message } = req.body;

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        maintenanceMode: enabled,
        maintenanceMessage: message || null
      });
    } else {
      await settings.update({
        maintenanceMode: enabled,
        maintenanceMessage: message || null
      });
    }

    res.json({
      success: true,
      message: `Mode maintenance ${enabled ? 'activé' : 'désactivé'}`,
      data: settings
    });
  } catch (error) {
    console.error('Erreur toggle maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mode maintenance',
      error: error.message
    });
  }
};