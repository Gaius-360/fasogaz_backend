// ==========================================
// FICHIER: controllers/adminPricingController.js
// Contrôleur Admin pour gérer la tarification client et revendeur
// ==========================================

const { Pricing, User, AccessPurchase, Subscription } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Obtenir toute la configuration de tarification
 * @route   GET /api/admin/pricing
 * @access  Private/Admin
 */
exports.getAllPricing = async (req, res) => {
  try {
    let clientConfig = await Pricing.findOne({ 
      where: { targetRole: 'client' } 
    });

    let revendeurConfig = await Pricing.findOne({ 
      where: { targetRole: 'revendeur' } 
    });

    // Créer les configs par défaut si elles n'existent pas
    if (!clientConfig) {
      clientConfig = await Pricing.create({
        targetRole: 'client',
        isActive: false,
        accessPrice24h: 500,
        accessDurationHours: 24,
        options: {
          allowMultiplePurchases: true,
          maxPurchasesPerDay: 10,
          notifyBeforeAccessExpiry: 2
        }
      });
    }

    if (!revendeurConfig) {
      revendeurConfig = await Pricing.create({
        targetRole: 'revendeur',
        isActive: false,
        freeTrialDays: 7,
        plans: {
          weekly: { price: 1000, duration: 7, enabled: false },
          monthly: { price: 3500, duration: 30, enabled: false },
          quarterly: { price: 9000, duration: 90, enabled: false },
          yearly: { price: 30000, duration: 365, enabled: false }
        },
        options: {
          autoRenew: true,
          gracePeriodDays: 3,
          notifyBeforeExpiry: 7
        }
      });
    }

    res.json({
      success: true,
      data: {
        client: {
          isActive: clientConfig.isActive,
          accessPrice24h: parseFloat(clientConfig.accessPrice24h),
          accessDurationHours: clientConfig.accessDurationHours,
          options: clientConfig.options,
          activatedAt: clientConfig.activatedAt
        },
        revendeur: {
          isActive: revendeurConfig.isActive,
          freeTrialDays: revendeurConfig.freeTrialDays,
          plans: revendeurConfig.plans,
          options: revendeurConfig.options,
          activatedAt: revendeurConfig.activatedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération config:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

/**
 * @desc    Mettre à jour la tarification CLIENT (accès 24h)
 * @route   PUT /api/admin/pricing/client
 * @access  Private/Admin
 */
exports.updateClientPricing = async (req, res) => {
  try {
    const { 
      isActive, 
      accessPrice24h, 
      accessDurationHours,
      options 
    } = req.body;

    // Validation
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le statut isActive est requis'
      });
    }

    if (isActive) {
      if (!accessPrice24h || accessPrice24h < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le prix doit être supérieur ou égal à 0'
        });
      }

      if (!accessDurationHours || accessDurationHours < 1) {
        return res.status(400).json({
          success: false,
          message: 'La durée doit être d\'au moins 1 heure'
        });
      }
    }

    // Récupérer ou créer la config
    let config = await Pricing.findOne({ 
      where: { targetRole: 'client' } 
    });

    const updateData = {
      isActive,
      accessPrice24h: parseFloat(accessPrice24h) || 0,
      accessDurationHours: parseInt(accessDurationHours) || 24
    };

    // Si on active pour la première fois
    if (isActive && config && !config.isActive && !config.activatedAt) {
      updateData.activatedAt = new Date();
    }

    // Mettre à jour les options si fournies
    if (options) {
      updateData.options = {
        ...config.options,
        ...options
      };
    }

    if (config) {
      await config.update(updateData);
    } else {
      config = await Pricing.create({
        targetRole: 'client',
        ...updateData,
        options: options || {
          allowMultiplePurchases: true,
          maxPurchasesPerDay: 10,
          notifyBeforeAccessExpiry: 2
        }
      });
    }

    // Si on désactive le système, informer les utilisateurs
    if (!isActive) {
      console.log('💡 Système de tarification client désactivé - Accès gratuit pour tous');
    }

    res.json({
      success: true,
      message: isActive 
        ? 'Tarification client activée avec succès'
        : 'Tarification client désactivée - Accès gratuit pour tous',
      data: {
        isActive: config.isActive,
        accessPrice24h: parseFloat(config.accessPrice24h),
        accessDurationHours: config.accessDurationHours,
        options: config.options,
        activatedAt: config.activatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour config client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

/**
 * @desc    Mettre à jour la tarification REVENDEUR (abonnements)
 * @route   PUT /api/admin/pricing/revendeur
 * @access  Private/Admin
 */
exports.updateRevendeurPricing = async (req, res) => {
  try {
    const { 
      isActive, 
      freeTrialDays,
      plans,
      options 
    } = req.body;

    // Validation
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le statut isActive est requis'
      });
    }

    // Récupérer ou créer la config
    let config = await Pricing.findOne({ 
      where: { targetRole: 'revendeur' } 
    });

    const updateData = {
      isActive,
      freeTrialDays: parseInt(freeTrialDays) || 0
    };

    // Si on active pour la première fois
    if (isActive && config && !config.isActive && !config.activatedAt) {
      updateData.activatedAt = new Date();
    }

    // Mettre à jour les plans si fournis
    if (plans) {
      updateData.plans = plans;
    }

    // Mettre à jour les options si fournies
    if (options) {
      updateData.options = {
        ...config.options,
        ...options
      };
    }

    if (config) {
      await config.update(updateData);
    } else {
      config = await Pricing.create({
        targetRole: 'revendeur',
        ...updateData,
        plans: plans || {
          weekly: { price: 0, duration: 7, enabled: false },
          monthly: { price: 0, duration: 30, enabled: false },
          quarterly: { price: 0, duration: 90, enabled: false },
          yearly: { price: 0, duration: 365, enabled: false }
        },
        options: options || {
          autoRenew: true,
          gracePeriodDays: 3,
          notifyBeforeExpiry: 7
        }
      });
    }

    res.json({
      success: true,
      message: isActive 
        ? 'Tarification revendeur activée avec succès'
        : 'Tarification revendeur désactivée - Accès gratuit pour tous',
      data: {
        isActive: config.isActive,
        freeTrialDays: config.freeTrialDays,
        plans: config.plans,
        options: config.options,
        activatedAt: config.activatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour config revendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir les statistiques d'accès client
 * @route   GET /api/admin/pricing/client/stats
 * @access  Private/Admin
 */
exports.getClientAccessStats = async (req, res) => {
  try {
    // Total des achats
    const totalPurchases = await AccessPurchase.count();

    // Revenus totaux
    const totalRevenue = await AccessPurchase.sum('amount', {
      where: { status: 'completed' }
    });

    // Achats aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const purchasesToday = await AccessPurchase.count({
      where: {
        purchaseDate: {
          [Op.gte]: today
        }
      }
    });

    const revenueToday = await AccessPurchase.sum('amount', {
      where: {
        purchaseDate: {
          [Op.gte]: today
        },
        status: 'completed'
      }
    });

    // Achats des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const purchasesWeek = await AccessPurchase.count({
      where: {
        purchaseDate: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    const revenueWeek = await AccessPurchase.sum('amount', {
      where: {
        purchaseDate: {
          [Op.gte]: sevenDaysAgo
        },
        status: 'completed'
      }
    });

    // Achats du mois
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const purchasesMonth = await AccessPurchase.count({
      where: {
        purchaseDate: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    const revenueMonth = await AccessPurchase.sum('amount', {
      where: {
        purchaseDate: {
          [Op.gte]: thirtyDaysAgo
        },
        status: 'completed'
      }
    });

    // Clients avec accès actif
    const activeClients = await User.count({
      where: {
        role: 'client',
        hasActiveAccess: true,
        accessExpiryDate: {
          [Op.gt]: new Date()
        }
      }
    });

    // Total clients
    const totalClients = await User.count({
      where: { role: 'client' }
    });

    // Méthodes de paiement populaires
    const paymentMethods = await AccessPurchase.findAll({
      attributes: [
        'paymentMethod',
        [AccessPurchase.sequelize.fn('COUNT', AccessPurchase.sequelize.col('id')), 'count'],
        [AccessPurchase.sequelize.fn('SUM', AccessPurchase.sequelize.col('amount')), 'total']
      ],
      where: { status: 'completed' },
      group: ['paymentMethod']
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalPurchases,
          totalRevenue: parseFloat(totalRevenue || 0),
          activeClients,
          totalClients,
          conversionRate: totalClients > 0 
            ? ((activeClients / totalClients) * 100).toFixed(2) 
            : 0
        },
        today: {
          purchases: purchasesToday,
          revenue: parseFloat(revenueToday || 0)
        },
        week: {
          purchases: purchasesWeek,
          revenue: parseFloat(revenueWeek || 0)
        },
        month: {
          purchases: purchasesMonth,
          revenue: parseFloat(revenueMonth || 0)
        },
        paymentMethods: paymentMethods.map(pm => ({
          method: pm.paymentMethod,
          count: parseInt(pm.get('count')),
          total: parseFloat(pm.get('total') || 0)
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erreur stats accès:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir l'historique des achats d'accès (admin)
 * @route   GET /api/admin/pricing/client/purchases
 * @access  Private/Admin
 */
exports.getClientAccessPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentMethod, userId } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (userId) where.userId = userId;

    const { count, rows: purchases } = await AccessPurchase.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
        }
      ],
      order: [['purchaseDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur historique achats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

module.exports = exports;