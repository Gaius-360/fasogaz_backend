// ==========================================
// FICHIER: controllers/accessController.js
// ✅ REFONTE: Abonnement classique pour les clients
//    Sans abonnement → 3 revendeurs max (les plus proches)
//    Avec abonnement → tous les revendeurs de toutes les villes + filtres débloqués
// ==========================================

const { User, Subscription, Pricing } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Vérifier le statut d'abonnement du client
 * @route   GET /api/access/status
 * @access  Private (Client)
 */
exports.checkAccessStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const pricingConfig = await Pricing.findOne({ where: { targetRole: 'client' } });

    // Système désactivé = accès gratuit illimité pour tous
    if (!pricingConfig || !pricingConfig.isActive) {
      return res.json({
        success: true,
        data: {
          hasAccess:      true,
          accessType:     'free',
          isSystemActive: false,
          message:        'Accès gratuit illimité',
          maxSellers:     null,
          expiresAt:      null,
          remainingDays:  null,
          plans:          null
        }
      });
    }

    const user = await User.findByPk(userId);
    const now  = new Date();

    // Abonnement actif
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now) {
      const remainingMs   = new Date(user.subscriptionEndDate) - now;
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
      return res.json({
        success: true,
        data: {
          hasAccess:      true,
          accessType:     'active',
          isSystemActive: true,
          message:        'Abonnement actif',
          maxSellers:     null,
          expiresAt:      user.subscriptionEndDate,
          remainingDays,
          plans:          _buildPlansInfo(pricingConfig)
        }
      });
    }

    // Période d'essai active
    if (user.freeTrialEndDate && new Date(user.freeTrialEndDate) > now) {
      const remainingMs   = new Date(user.freeTrialEndDate) - now;
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
      return res.json({
        success: true,
        data: {
          hasAccess:      true,
          accessType:     'trial',
          isSystemActive: true,
          message:        `Période d'essai — ${remainingDays} jour(s) restant(s)`,
          maxSellers:     null,
          expiresAt:      user.freeTrialEndDate,
          remainingDays,
          plans:          _buildPlansInfo(pricingConfig)
        }
      });
    }

    // Aucun abonnement → limite à 3 revendeurs
    return res.json({
      success: true,
      data: {
        hasAccess:      false,
        accessType:     'none',
        isSystemActive: true,
        message:        'Abonnement requis pour voir tous les revendeurs',
        maxSellers:     3,
        expiresAt:      null,
        remainingDays:  null,
        plans:          _buildPlansInfo(pricingConfig)
      }
    });

  } catch (error) {
    console.error('❌ Erreur statut accès:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * @desc    Plans disponibles (public)
 * @route   GET /api/access/pricing
 * @access  Public
 */
exports.getPricing = async (req, res) => {
  try {
    const pricingConfig = await Pricing.findOne({ where: { targetRole: 'client' } });

    if (!pricingConfig || !pricingConfig.isActive) {
      return res.json({
        success: true,
        data: { isActive: false, message: 'Accès gratuit illimité', plans: {} }
      });
    }

    return res.json({
      success: true,
      data: {
        isActive:                      true,
        maxSellersWithoutSubscription: 3,
        plans:                         pricingConfig.plans || {}
      }
    });

  } catch (error) {
    console.error('❌ Erreur tarification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * @desc    Historique des abonnements du client
 * @route   GET /api/access/history
 * @access  Private (Client)
 */
exports.getAccessHistory = async (req, res) => {
  try {
    const userId                   = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset                   = (page - 1) * limit;

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where:  { userId },
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        purchases: subscriptions.map(s => ({
          id:            s.id,
          planType:      s.planType,
          amount:        parseFloat(s.amount),
          durationHours: (s.duration || 30) * 24,
          purchaseDate:  s.createdAt,
          expiryDate:    s.endDate,
          paymentMethod: s.paymentMethod || 'ligdicash',
          status:        s.status,
          isActive:      s.isActive
        })),
        pagination: {
          total:      count,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur historique:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * @desc    Statistiques d'abonnement du client
 * @route   GET /api/access/stats
 * @access  Private (Client)
 */
exports.getAccessStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalPurchases = await Subscription.count({ where: { userId } });

    const totalSpent = await Subscription.sum('amount', {
      where: { userId, status: { [Op.in]: ['active', 'completed'] } }
    });

    const lastSubscription = await Subscription.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPurchases = await Subscription.count({
      where: { userId, createdAt: { [Op.gte]: thirtyDaysAgo } }
    });

    res.json({
      success: true,
      data: {
        totalPurchases,
        totalSpent:     parseFloat(totalSpent || 0),
        recentPurchases,
        lastPurchase:   lastSubscription
          ? {
              date:       lastSubscription.createdAt,
              amount:     parseFloat(lastSubscription.amount),
              expiryDate: lastSubscription.endDate
            }
          : null
      }
    });

  } catch (error) {
    console.error('❌ Erreur stats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ── Helper privé ──────────────────────────────────────────────────────────────

function _buildPlansInfo(pricingConfig) {
  if (!pricingConfig?.plans) return {};
  return Object.fromEntries(
    Object.entries(pricingConfig.plans).filter(([, p]) => p.enabled)
  );
}

module.exports = exports;