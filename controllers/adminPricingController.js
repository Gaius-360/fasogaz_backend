// ==========================================
// FICHIER: controllers/adminPricingController.js
// ✅ REFONTE: updateClientPricing utilise plans (comme revendeur)
//    Suppression: accessPrice24h, accessDurationHours
// ==========================================

const { Pricing, User, Subscription } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Obtenir toute la configuration de tarification
 * @route   GET /api/admin/pricing
 * @access  Admin
 */
exports.getAllPricing = async (req, res) => {
  try {
    let clientConfig   = await Pricing.findOne({ where: { targetRole: 'client' } });
    let revendeurConfig = await Pricing.findOne({ where: { targetRole: 'revendeur' } });

    const defaultPlans = {
      weekly:    { price: 0, duration: 7,   enabled: false },
      monthly:   { price: 0, duration: 30,  enabled: false },
      quarterly: { price: 0, duration: 90,  enabled: false },
      yearly:    { price: 0, duration: 365, enabled: false }
    };

    if (!clientConfig) {
      clientConfig = await Pricing.create({
        targetRole: 'client',
        isActive:   false,
        plans:      { ...defaultPlans, monthly: { price: 2500, duration: 30, enabled: true } },
        options:    { autoRenew: true, gracePeriodDays: 3, notifyBeforeExpiry: 7 }
      });
    }

    if (!revendeurConfig) {
      revendeurConfig = await Pricing.create({
        targetRole:    'revendeur',
        isActive:      false,
        freeTrialDays: 0,
        plans:         defaultPlans,
        options:       { autoRenew: true, gracePeriodDays: 3, notifyBeforeExpiry: 7 }
      });
    }

    res.json({
      success: true,
      data: {
        client: {
          isActive:                     clientConfig.isActive,
          maxSellersWithoutSubscription: 5,
          plans:                        clientConfig.plans,
          options:                      clientConfig.options,
          activatedAt:                  clientConfig.activatedAt
        },
        revendeur: {
          isActive:      revendeurConfig.isActive,
          freeTrialDays: revendeurConfig.freeTrialDays || 0,
          plans:         revendeurConfig.plans,
          options:       revendeurConfig.options,
          activatedAt:   revendeurConfig.activatedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération config:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * @desc    Mettre à jour la tarification CLIENT
 * @route   PUT /api/admin/pricing/client
 * @access  Admin
 */
exports.updateClientPricing = async (req, res) => {
  try {
    const { isActive, plans, options } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive (boolean) requis' });
    }

    // Validation des plans si système activé
    if (isActive && plans) {
      const enabledPlans = Object.values(plans).filter(p => p.enabled);
      if (enabledPlans.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Au moins un plan doit être activé quand le système est actif'
        });
      }
      for (const [key, plan] of Object.entries(plans)) {
        if (plan.enabled && (plan.price === undefined || plan.price < 0)) {
          return res.status(400).json({ success: false, message: `Prix invalide pour le plan "${key}"` });
        }
      }
    }

    let config = await Pricing.findOne({ where: { targetRole: 'client' } });

    const updateData = { isActive };
    if (plans)   updateData.plans   = plans;
    if (options) updateData.options = { ...(config?.options || {}), ...options };
    if (isActive && config && !config.isActive && !config.activatedAt) {
      updateData.activatedAt = new Date();
    }

    if (config) {
      await config.update(updateData);
    } else {
      config = await Pricing.create({
        targetRole: 'client',
        ...updateData,
        plans:   plans || { monthly: { price: 2500, duration: 30, enabled: true } },
        options: options || { autoRenew: true, gracePeriodDays: 3, notifyBeforeExpiry: 7 }
      });
    }

    res.json({
      success: true,
      message: isActive
        ? '✅ Tarification client activée (sans abonnement = 5 revendeurs max)'
        : '✅ Tarification client désactivée — Accès gratuit illimité',
      data: {
        isActive:                     config.isActive,
        maxSellersWithoutSubscription: 5,
        plans:                        config.plans,
        options:                      config.options,
        activatedAt:                  config.activatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour config client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * @desc    Mettre à jour la tarification REVENDEUR
 * @route   PUT /api/admin/pricing/revendeur
 * @access  Admin
 */
exports.updateRevendeurPricing = async (req, res) => {
  try {
    const { isActive, freeTrialDays, plans, options } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive (boolean) requis' });
    }

    let config = await Pricing.findOne({ where: { targetRole: 'revendeur' } });

    const updateData = {
      isActive,
      freeTrialDays: parseInt(freeTrialDays) || 0
    };
    if (plans)   updateData.plans   = plans;
    if (options) updateData.options = { ...(config?.options || {}), ...options };
    if (isActive && config && !config.isActive && !config.activatedAt) {
      updateData.activatedAt = new Date();
    }

    if (config) {
      await config.update(updateData);
    } else {
      config = await Pricing.create({
        targetRole: 'revendeur',
        ...updateData,
        plans:   plans || { weekly: { price: 0, duration: 7, enabled: false }, monthly: { price: 0, duration: 30, enabled: false }, quarterly: { price: 0, duration: 90, enabled: false }, yearly: { price: 0, duration: 365, enabled: false } },
        options: options || { autoRenew: true, gracePeriodDays: 3, notifyBeforeExpiry: 7 }
      });
    }

    res.json({
      success: true,
      message: isActive
        ? '✅ Tarification revendeur activée'
        : '✅ Tarification revendeur désactivée — Accès gratuit illimité',
      data: {
        isActive:      config.isActive,
        freeTrialDays: config.freeTrialDays,
        plans:         config.plans,
        options:       config.options,
        activatedAt:   config.activatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour config revendeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * @desc    Statistiques des abonnements clients
 * @route   GET /api/admin/pricing/client/stats
 * @access  Admin
 */
exports.getClientAccessStats = async (req, res) => {
  try {
    // Total abonnements clients (toutes les souscriptions où user.role = 'client')
    const totalPurchases = await Subscription.count({
      include: [{ model: User, as: 'user', where: { role: 'client' }, attributes: [] }]
    });

    const totalRevenue = await Subscription.sum('amount', {
      where:   { status: { [Op.in]: ['active', 'completed'] } },
      include: [{ model: User, as: 'user', where: { role: 'client' }, attributes: [] }]
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const purchasesToday = await Subscription.count({
      where:   { createdAt: { [Op.gte]: today } },
      include: [{ model: User, as: 'user', where: { role: 'client' }, attributes: [] }]
    });

    const revenueToday = await Subscription.sum('amount', {
      where:   { createdAt: { [Op.gte]: today }, status: { [Op.in]: ['active', 'completed'] } },
      include: [{ model: User, as: 'user', where: { role: 'client' }, attributes: [] }]
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const purchasesMonth = await Subscription.count({
      where:   { createdAt: { [Op.gte]: thirtyDaysAgo } },
      include: [{ model: User, as: 'user', where: { role: 'client' }, attributes: [] }]
    });

    const revenueMonth = await Subscription.sum('amount', {
      where:   { createdAt: { [Op.gte]: thirtyDaysAgo }, status: { [Op.in]: ['active', 'completed'] } },
      include: [{ model: User, as: 'user', where: { role: 'client' }, attributes: [] }]
    });

    // Clients avec abonnement actif
    const activeClients = await User.count({
      where: {
        role:                'client',
        subscriptionEndDate: { [Op.gt]: new Date() }
      }
    });

    const totalClients = await User.count({ where: { role: 'client' } });

    res.json({
      success: true,
      data: {
        overview: {
          totalPurchases,
          totalRevenue:   parseFloat(totalRevenue || 0),
          activeClients,
          totalClients,
          conversionRate: totalClients > 0
            ? ((activeClients / totalClients) * 100).toFixed(1)
            : 0
        },
        today: {
          purchases: purchasesToday,
          revenue:   parseFloat(revenueToday || 0)
        },
        month: {
          purchases: purchasesMonth,
          revenue:   parseFloat(revenueMonth || 0)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur stats abonnements clients:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * @desc    Historique des abonnements clients (admin)
 * @route   GET /api/admin/pricing/client/purchases
 * @access  Admin
 */
exports.getClientAccessPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, planType, userId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status)   where.status   = status;
    if (planType) where.planType = planType;
    if (userId)   where.userId   = userId;

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where,
      include: [{
        model:      User,
        as:         'user',
        where:      { role: 'client' },
        attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
      }],
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        purchases: subscriptions,
        pagination: {
          total:      count,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur historique achats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

module.exports = exports;