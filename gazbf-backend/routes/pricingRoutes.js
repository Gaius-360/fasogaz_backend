const express = require('express');
const router = express.Router();
const { Pricing, User } = require('../models');
const { protect } = require('../middleware/auth');
const { getAccessStatus } = require('../middleware/subscriptionMiddleware');

/**
 * Config CLIENT (PUBLIC)
 */
router.get('/client', async (req, res) => {
  try {
    const config = await Pricing.findOne({
      where: { targetRole: 'client' }
    });

    if (!config) {
      return res.json({
        success: true,
        data: {
          isActive: false,
          accessPrice24h: 0,
          accessDurationHours: 24
        }
      });
    }

    res.json({
      success: true,
      data: {
        isActive: config.isActive,
        accessPrice24h: config.accessPrice24h || 0,
        accessDurationHours: config.accessDurationHours || 24,
        options: config.options || {}
      }
    });
  } catch (error) {
    console.error('❌ Erreur config client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * Config REVENDEUR (PUBLIC)
 */
router.get('/revendeur', async (req, res) => {
  try {
    const config = await Pricing.findOne({ where: { targetRole: 'revendeur' } });

    const defaultConfig = {
      isActive: false,
      freeTrialDays: 0,
      plans: {},
      options: {}
    };

    res.json({
      success: true,
      data: config ? {
        isActive: config.isActive,
        freeTrialDays: config.freeTrialDays,
        plans: config.plans,
        options: config.options
      } : defaultConfig
    });
  } catch (error) {
    console.error('❌ Erreur config revendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération config',
      error: error.message
    });
  }
});

/**
 * Statut d'accès (PROTECTED)
 */
router.get('/status', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const user = await User.findByPk(userId);
    const now = new Date();

    const targetRole = userRole === 'revendeur' ? 'revendeur' : 'client';
    const pricingConfig = await Pricing.findOne({ where: { targetRole } });

    // Système désactivé = accès gratuit
    if (!pricingConfig || !pricingConfig.isActive) {
      return res.json({
        success: true,
        data: {
          hasAccess: true,
          type: 'free_unlimited',
          details: { message: 'Accès gratuit illimité' }
        }
      });
    }

    // Vérifier abonnement actif
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.subscriptionEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      return res.json({
        success: true,
        data: {
          hasAccess: true,
          type: 'active_subscription',
          details: {
            endDate: user.subscriptionEndDate,
            daysRemaining,
            autoRenew: user.subscriptionAutoRenew || false
          }
        }
      });
    }

    // Vérifier période d'essai
    if (user.freeTrialEndDate && new Date(user.freeTrialEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.freeTrialEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      return res.json({
        success: true,
        data: {
          hasAccess: true,
          type: 'free_trial',
          details: {
            endDate: user.freeTrialEndDate,
            daysRemaining,
            totalDays: pricingConfig.freeTrialDays
          }
        }
      });
    }

    // Vérifier période de grâce
    if (user.gracePeriodEndDate && new Date(user.gracePeriodEndDate) > now) {
      const daysRemaining = Math.ceil(
        (new Date(user.gracePeriodEndDate) - now) / (1000 * 60 * 60 * 24)
      );
      
      return res.json({
        success: true,
        data: {
          hasAccess: true,
          type: 'grace_period',
          details: {
            endDate: user.gracePeriodEndDate,
            daysRemaining,
            message: 'Renouvelez pour ne pas perdre l\'accès'
          }
        }
      });
    }

    // Aucun accès
    res.json({
      success: true,
      data: {
        hasAccess: false,
        type: 'no_access',
        details: {
          message: 'Abonnement requis',
          freeTrialUsed: user.freeTrialUsed || false
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;