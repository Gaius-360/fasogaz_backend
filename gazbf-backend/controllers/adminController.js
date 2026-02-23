// ==========================================
// FICHIER: controllers/adminController.js
// ✅ CORRECTIONS: Revenus par source + getRevenueChart + newSellers
// ==========================================

const db = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');

// ========================================
// STATISTIQUES DASHBOARD
// ========================================

// @desc    Obtenir les stats du dashboard
// @route   GET /api/admin/stats/dashboard
// @access  Private (admin)
exports.getDashboardStats = async (req, res) => {
  try {
    // Utilisateurs
    const totalUsers = await db.User.count();
    const clients = await db.User.count({ where: { role: 'client' } });
    const sellers = await db.User.count({ where: { role: 'revendeur' } });
    
    // Nouveaux utilisateurs ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = await db.User.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // ✅ AJOUT: Nouveaux revendeurs ce mois
    const newSellersThisMonth = await db.User.count({
      where: {
        role: 'revendeur',
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // Croissance utilisateurs (mois dernier vs ce mois)
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    
    const lastMonthUsers = await db.User.count({
      where: {
        createdAt: {
          [Op.gte]: startOfLastMonth,
          [Op.lt]: startOfMonth
        }
      }
    });

    const userGrowth = lastMonthUsers > 0
      ? Math.round(((newThisMonth - lastMonthUsers) / lastMonthUsers) * 100)
      : 100;

    // Abonnements — total
    const activeSubscriptions = await db.Subscription.count({
      where: { isActive: true }
    });

    // Abonnements actifs clients — jointure User car planType ne contient
    // pas 'client'/'seller', c'est le rôle de l'utilisateur qui fait foi
    const activeClientSubs = await db.Subscription.count({
      where: { isActive: true },
      include: [{
        model: db.User,
        as: 'user',
        where: { role: 'client' },
        attributes: [],
        required: true
      }]
    });

    // Abonnements actifs revendeurs
    const activeSellerSubs = await db.Subscription.count({
      where: { isActive: true },
      include: [{
        model: db.User,
        as: 'user',
        where: { role: 'revendeur' },
        attributes: [],
        required: true
      }]
    });

    // Abonnements expirant dans 3 jours
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const expiringIn3Days = await db.Subscription.count({
      where: {
        isActive: true,
        endDate: { [Op.between]: [new Date(), in3Days] }
      }
    });

    // Taux d'abonnement
    const clientRate = clients > 0 ? Math.round((activeClientSubs / clients) * 100) : 0;
    const sellerRate = sellers > 0 ? Math.round((activeSellerSubs / sellers) * 100) : 0;

    // Commandes
    const totalOrders = await db.Order.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const ordersToday = await db.Order.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    const completedOrders = await db.Order.count({
      where: { status: 'completed' }
    });

    const successRate = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

    // Revenus globaux — depuis les transactions complétées (tous types)
    // Les vrais types ENUM sont : seller_subscription, seller_subscription_renewal,
    // seller_early_renewal, client_access, order_payment
    const allCompletedTxns = await db.Transaction.findAll({
      where: { status: 'completed' },
      attributes: ['amount', 'createdAt']
    });

    const totalRevenue = allCompletedTxns.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0), 0
    );

    const thisMonthRevenue = allCompletedTxns
      .filter(t => new Date(t.createdAt) >= startOfMonth)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const lastMonthRevenue = allCompletedTxns
      .filter(t => {
        const d = new Date(t.createdAt);
        return d >= startOfLastMonth && d < startOfMonth;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : (thisMonthRevenue > 0 ? 100 : 0);

    const todayRevenue = allCompletedTxns
      .filter(t => {
        const d = new Date(t.createdAt);
        return d >= today && d < tomorrow;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Revenus par source — abonnements clients vs revendeurs
    // Types ENUM réels : 'seller_subscription', 'seller_subscription_renewal',
    // 'seller_early_renewal' pour les revendeurs ; 'client_access' pour les clients.
    // On utilise le rôle de l'utilisateur joint pour distinguer les deux sources.
    const subscriptionTransactions = await db.Transaction.findAll({
      where: {
        status: 'completed',
        type: {
          [Op.in]: [
            'seller_subscription',
            'seller_subscription_renewal',
            'seller_early_renewal',
            'client_access'
          ]
        }
      },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['role'],
        required: false  // LEFT JOIN — garder les transactions même si user supprimé
      }]
    });

    // Revenus abonnements clients (type client_access)
    const clientRevenue = subscriptionTransactions
      .filter(t => t.user && t.user.role === 'client')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Revenus abonnements revendeurs (seller_subscription + renouvellements)
    const sellerRevenue = subscriptionTransactions
      .filter(t => t.user && t.user.role === 'revendeur')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Validation revendeurs
    const pendingValidation = await db.User.count({
      where: {
        role: 'revendeur',
        validationStatus: 'pending'
      }
    });

    const validatedSellers = await db.User.count({
      where: {
        role: 'revendeur',
        validationStatus: 'approved'
      }
    });

    const validationRate = sellers > 0
      ? Math.round((validatedSellers / sellers) * 100)
      : 0;

    // Alertes critiques
    const criticalAlerts = [];

    if (pendingValidation > 5) {
      criticalAlerts.push({
        id: 'pending-sellers',
        message: `${pendingValidation} revendeurs en attente de validation`,
        severity: 'high'
      });
    }

    if (expiringIn3Days > 10) {
      criticalAlerts.push({
        id: 'expiring-subs',
        message: `${expiringIn3Days} abonnements expirent dans 3 jours`,
        severity: 'medium'
      });
    }

    // Construire la réponse
    const stats = {
      users: {
        total: totalUsers,
        clients,
        sellers,
        newThisMonth,
        newSellers: newSellersThisMonth, // ✅ AJOUT
        growth: userGrowth
      },
      subscriptions: {
        total: activeSubscriptions,
        activeClients: activeClientSubs,
        activeSellers: activeSellerSubs,
        expiringIn3Days,
        clientRate,
        sellerRate
      },
      orders: {
        total: totalOrders,
        today: ordersToday,
        completed: completedOrders,
        successRate
      },
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        today: todayRevenue,
        growth: revenueGrowth,
        bySource: {
          clients: clientRevenue,   // ✅ CORRIGÉ
          sellers: sellerRevenue    // ✅ CORRIGÉ
        }
      },
      validation: {
        pending: pendingValidation,
        validated: validatedSellers,
        validationRate
      },
      alerts: {
        critical: criticalAlerts
      }
    };

    return ResponseHandler.success(
      res,
      'Statistiques récupérées',
      stats
    );
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir les Top Revendeurs du mois
// @route   GET /api/admin/stats/top-sellers
// @access  Private (admin)
exports.getTopSellers = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completedOrders = await db.Order.findAll({
      where: {
        status: 'completed',
        completedAt: { [Op.gte]: startOfMonth }
      },
      attributes: ['sellerId', 'total'],
      raw: true
    });

    const sellerMap = {};
    completedOrders.forEach(order => {
      const id = order.sellerId;
      if (!sellerMap[id]) {
        sellerMap[id] = { revenue: 0, orders: 0 };
      }
      sellerMap[id].revenue += parseFloat(order.total || 0);
      sellerMap[id].orders += 1;
    });

    const topIds = Object.entries(sellerMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, parseInt(limit))
      .map(entry => entry[0]);

    if (topIds.length === 0) {
      return ResponseHandler.success(res, 'Top revendeurs récupérés', []);
    }

    const sellers = await db.User.findAll({
      where: {
        id: { [Op.in]: topIds },
        role: 'revendeur'
      },
      attributes: ['id', 'businessName', 'quarter', 'city']
    });

    const topSellers = topIds.map(id => {
      const seller = sellers.find(s => s.id === id);
      if (!seller) return null;
      return {
        id: seller.id,
        name: seller.businessName || 'Revendeur inconnu',
        location: seller.quarter || seller.city || 'Non spécifié',
        revenue: parseFloat(sellerMap[id].revenue.toFixed(2)),
        orders: sellerMap[id].orders
      };
    }).filter(Boolean);

    return ResponseHandler.success(res, 'Top revendeurs récupérés', topSellers);
  } catch (error) {
    console.error('Erreur top revendeurs:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir le graphique des revenus
// @route   GET /api/admin/stats/revenue
// @access  Private (admin)
// ✅ Retourne { date, clients, sellers } basé sur les abonnements uniquement
exports.getRevenueChart = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let startDate = new Date();
    if (period === '7days')       startDate.setDate(startDate.getDate() - 7);
    else if (period === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90days') startDate.setDate(startDate.getDate() - 90);

    // Transactions d'abonnements complétées — types ENUM réels du modèle Transaction
    const transactions = await db.Transaction.findAll({
      where: {
        status: 'completed',
        type: {
          [Op.in]: [
            'seller_subscription',
            'seller_subscription_renewal',
            'seller_early_renewal',
            'client_access'
          ]
        },
        createdAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['role'],
          required: false  // LEFT JOIN
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Grouper par jour ET par rôle utilisateur
    const revenueByDay = {};

    transactions.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString('fr-FR');
      if (!revenueByDay[date]) {
        revenueByDay[date] = { date, clients: 0, sellers: 0 };
      }
      const amount = parseFloat(t.amount || 0);
      if (t.user?.role === 'client') {
        revenueByDay[date].clients += amount;
      } else if (t.user?.role === 'revendeur') {
        revenueByDay[date].sellers += amount;
      }
    });

    // Trier par date chronologique (format fr-FR : dd/mm/yyyy)
    const chartData = Object.values(revenueByDay).sort((a, b) => {
      const [da, ma, ya] = a.date.split('/').map(Number);
      const [db2, mb, yb] = b.date.split('/').map(Number);
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db2);
    });

    return ResponseHandler.success(
      res,
      'Données de revenus récupérées',
      chartData
    );
  } catch (error) {
    console.error('Erreur graphique revenus:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// ========================================
// GESTION UTILISATEURS
// ========================================

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const where = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { phone: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { businessName: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: users } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Subscription,
          as: 'subscription'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return ResponseHandler.success(
      res,
      'Utilisateurs récupérés',
      {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Subscription, as: 'subscription' },
        { model: db.Product, as: 'products' },
        { model: db.Order, as: 'ordersAsCustomer' },
        { model: db.Order, as: 'ordersAsSeller' }
      ]
    });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    return ResponseHandler.success(res, 'Utilisateur récupéré', user);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id);

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    await user.update({ isActive: !user.isActive });

    return ResponseHandler.success(
      res,
      `Utilisateur ${user.isActive ? 'activé' : 'désactivé'}`,
      user
    );
  } catch (error) {
    console.error('Erreur toggle status:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'opération', 500);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id);

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    await user.destroy();

    return ResponseHandler.success(res, 'Utilisateur supprimé');
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// ============================================
// GESTION DES CLIENTS
// ============================================

exports.getAllClients = async (req, res) => {
  try {
    const clients = await db.User.findAll({
      where: { role: 'client' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(res, 'Clients récupérés', clients);
  } catch (error) {
    console.error('❌ Erreur all clients:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await db.User.findOne({
      where: { id, role: 'client' },
      attributes: { exclude: ['password'] },
      include: [{ model: db.Subscription, as: 'subscription' }]
    });

    if (!client) {
      return ResponseHandler.error(res, 'Client non trouvé', 404);
    }

    const orders = await db.Order.findAll({
      where: { customerId: id },
      include: [
        { model: db.User, as: 'seller', attributes: ['id', 'businessName', 'phone'] },
        {
          model: db.OrderItem,
          as: 'items',
          include: [{ model: db.Product, as: 'product', attributes: ['bottleType', 'brand'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const addresses = await db.Address.findAll({
      where: { userId: id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });

    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalSpent = completedOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0;
    const completionRate = orders.length > 0
      ? Math.round((completedOrders.length / orders.length) * 100)
      : 0;
    const accountAge = Math.max(1, Math.floor((Date.now() - new Date(client.createdAt)) / (30 * 86400000)));
    const ordersPerMonth = orders.length > 0 ? (orders.length / accountAge).toFixed(1) : 0;
    const lastOrder = orders.length > 0 ? orders[0].createdAt : null;

    const stats = {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      completionRate,
      ordersPerMonth: parseFloat(ordersPerMonth),
      lastOrder
    };

    const responseData = {
      ...client.toJSON(),
      orders: orders.slice(0, 20),
      addresses,
      stats
    };

    return ResponseHandler.success(res, 'Client récupéré avec statistiques complètes', responseData);
  } catch (error) {
    console.error('❌ Erreur getClientById:', error);
    return ResponseHandler.error(res, error.message || 'Erreur lors de la récupération', 500);
  }
};

exports.blockClient = async (req, res) => {
  try {
    const { reason } = req.body;
    const client = await db.User.findByPk(req.params.id);

    if (!client || client.role !== 'client') {
      return ResponseHandler.error(res, 'Client non trouvé', 404);
    }

    await client.update({ isBlocked: true, blockReason: reason });

    return ResponseHandler.success(res, 'Client bloqué');
  } catch (error) {
    console.error('❌ Erreur blocage client:', error);
    return ResponseHandler.error(res, 'Erreur lors du blocage', 500);
  }
};

exports.unblockClient = async (req, res) => {
  try {
    const client = await db.User.findByPk(req.params.id);

    if (!client || client.role !== 'client') {
      return ResponseHandler.error(res, 'Client non trouvé', 404);
    }

    await client.update({ isBlocked: false, blockReason: null });

    return ResponseHandler.success(res, 'Client débloqué');
  } catch (error) {
    console.error('❌ Erreur déblocage client:', error);
    return ResponseHandler.error(res, 'Erreur lors du déblocage', 500);
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await db.User.findByPk(req.params.id);

    if (!client || client.role !== 'client') {
      return ResponseHandler.error(res, 'Client non trouvé', 404);
    }

    await client.destroy();

    return ResponseHandler.success(res, 'Client supprimé');
  } catch (error) {
    console.error('❌ Erreur suppression client:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// ========================================
// VALIDATION REVENDEURS
// ========================================

exports.getPendingSellers = async (req, res) => {
  try {
    const sellers = await db.User.findAll({
      where: { role: 'revendeur', validationStatus: 'pending' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'ASC']]
    });

    return ResponseHandler.success(res, 'Revendeurs en attente récupérés', sellers);
  } catch (error) {
    console.error('Erreur récupération revendeurs:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.getAllSellers = async (req, res) => {
  try {
    const { status } = req.query;

    const where = { role: 'revendeur' };
    if (status) {
      where.validationStatus = status;
    }

    const sellers = await db.User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Subscription, as: 'subscription' },
        { model: db.Product, as: 'products' }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(res, 'Revendeurs récupérés', sellers);
  } catch (error) {
    console.error('Erreur récupération revendeurs:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.getSellerById = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await db.User.findOne({
      where: { id, role: 'revendeur' },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Product,
          as: 'products',
          attributes: ['id', 'bottleType', 'brand', 'price', 'quantity', 'status', 'viewCount', 'orderCount', 'createdAt']
        }
      ]
    });

    if (!seller) {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    const orders = await db.Order.findAll({
      where: { sellerId: id },
      include: [
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        {
          model: db.OrderItem,
          as: 'items',
          include: [{ model: db.Product, as: 'product', attributes: ['bottleType', 'brand'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const reviews = await db.Review.findAll({
      where: { sellerId: id },
      include: [
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName'] },
        { model: db.Order, as: 'order', attributes: ['id', 'orderNumber'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      products: {
        total: seller.products.length,
        available: seller.products.filter(p => p.status === 'available').length,
        limited: seller.products.filter(p => p.status === 'limited').length,
        outOfStock: seller.products.filter(p => p.status === 'out_of_stock').length,
        totalStock: seller.products.reduce((sum, p) => sum + p.quantity, 0),
        totalViews: seller.products.reduce((sum, p) => sum + (p.viewCount || 0), 0)
      },
      orders: {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        accepted: orders.filter(o => o.status === 'accepted').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        inDelivery: orders.filter(o => o.status === 'in_delivery').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        rejected: orders.filter(o => o.status === 'rejected').length
      },
      revenue: {
        total: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
        thisMonth: orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          const now = new Date();
          return o.status === 'completed' &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
        }).reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
        today: orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          const today = new Date();
          return o.status === 'completed' && orderDate.toDateString() === today.toDateString();
        }).reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
        average: orders.filter(o => o.status === 'completed').length > 0
          ? orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.total || 0), 0) /
            orders.filter(o => o.status === 'completed').length
          : 0
      },
      reviews: {
        total: reviews.length,
        average: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        withResponse: reviews.filter(r => r.sellerResponse).length,
        withoutResponse: reviews.filter(r => !r.sellerResponse).length,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      },
      performance: {
        orderCompletionRate: orders.length > 0
          ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100)
          : 0,
        averageRating: reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
          : 0
      }
    };

    reviews.forEach(r => { if (stats.reviews.distribution[r.rating] !== undefined) stats.reviews.distribution[r.rating]++; });

    const responseData = {
      ...seller.toJSON(),
      stats,
      recentOrders: orders.slice(0, 10).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        deliveryMode: o.deliveryMode,
        createdAt: o.createdAt,
        customer: o.customer,
        itemsCount: o.items?.length || 0
      })),
      recentReviews: reviews.slice(0, 5).map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        customer: r.customer,
        hasResponse: !!r.sellerResponse
      }))
    };

    return ResponseHandler.success(res, 'Revendeur récupéré avec statistiques complètes', responseData);
  } catch (error) {
    console.error('❌ Erreur getSellerById:', error);
    return ResponseHandler.error(res, error.message || 'Erreur lors de la récupération', 500);
  }
};

exports.validateSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await db.User.findOne({ where: { id, role: 'revendeur' } });

    if (!seller) {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    await seller.update({ validationStatus: 'approved', rejectionReason: null });

    await db.Notification.create({
      userId: seller.id,
      type: 'system',
      title: '✅ Profil approuvé',
      message: 'Félicitations ! Votre profil a été validé. Vous pouvez maintenant commencer à vendre.',
      priority: 'high',
      actionUrl: '/seller/dashboard'
    });

    return ResponseHandler.success(res, 'Revendeur validé avec succès', seller);
  } catch (error) {
    console.error('Erreur validation revendeur:', error);
    return ResponseHandler.error(res, 'Erreur lors de la validation', 500);
  }
};

exports.rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return ResponseHandler.error(res, 'La raison du rejet est requise', 400);
    }

    const seller = await db.User.findOne({ where: { id, role: 'revendeur' } });

    if (!seller) {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    await seller.update({ validationStatus: 'rejected', rejectionReason: reason });

    await db.Notification.create({
      userId: seller.id,
      type: 'system',
      title: '❌ Profil rejeté',
      message: `Votre profil a été rejeté. Raison: ${reason}`,
      priority: 'high',
      actionUrl: '/seller/profile'
    });

    return ResponseHandler.success(res, 'Revendeur rejeté', seller);
  } catch (error) {
    console.error('Erreur rejet revendeur:', error);
    return ResponseHandler.error(res, 'Erreur lors du rejet', 500);
  }
};

exports.suspendSeller = async (req, res) => {
  try {
    const { reason } = req.body;
    const seller = await db.User.findByPk(req.params.id);

    if (!seller || seller.role !== 'revendeur') {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    await seller.update({ validationStatus: 'suspended', suspensionReason: reason });

    return ResponseHandler.success(res, 'Revendeur suspendu');
  } catch (error) {
    console.error('❌ Erreur suspension seller:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suspension', 500);
  }
};

exports.reactivateSeller = async (req, res) => {
  try {
    const seller = await db.User.findByPk(req.params.id);

    if (!seller || seller.role !== 'revendeur') {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    await seller.update({ validationStatus: 'approved', suspensionReason: null });

    return ResponseHandler.success(res, 'Revendeur réactivé');
  } catch (error) {
    console.error('❌ Erreur réactivation seller:', error);
    return ResponseHandler.error(res, 'Erreur lors de la réactivation', 500);
  }
};

exports.deleteSeller = async (req, res) => {
  try {
    const seller = await db.User.findByPk(req.params.id);

    if (!seller || seller.role !== 'revendeur') {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    await seller.destroy();

    return ResponseHandler.success(res, 'Revendeur supprimé');
  } catch (error) {
    console.error('❌ Erreur suppression seller:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// ========================================
// GESTION PRODUITS
// ========================================

exports.getAllProducts = async (req, res) => {
  try {
    const { status, bottleType, brand, search, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status)     where.status = status;
    if (bottleType) where.bottleType = bottleType;
    if (brand)      where.brand = brand;
    if (search) {
      where[Op.or] = [
        { bottleType: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: products } = await db.Product.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'seller', attributes: ['id', 'businessName', 'phone', 'city'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return ResponseHandler.success(res, 'Produits récupérés', {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id);

    if (!product) {
      return ResponseHandler.error(res, 'Produit non trouvé', 404);
    }

    await product.destroy();

    return ResponseHandler.success(res, 'Produit supprimé');
  } catch (error) {
    console.error('Erreur suppression produit:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// ========================================
// GESTION COMMANDES
// ========================================

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: db.User, as: 'seller', attributes: ['id', 'businessName', 'phone'] },
        { model: db.OrderItem, as: 'items', include: [{ model: db.Product, as: 'product' }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return ResponseHandler.success(res, 'Commandes récupérées', {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.Order.findByPk(id, {
      include: [
        { model: db.User, as: 'customer', attributes: { exclude: ['password'] } },
        { model: db.User, as: 'seller', attributes: { exclude: ['password'] } },
        { model: db.Address, as: 'deliveryAddress' },
        { model: db.OrderItem, as: 'items', include: [{ model: db.Product, as: 'product' }] },
        { model: db.Review, as: 'review' }
      ]
    });

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    return ResponseHandler.success(res, 'Commande récupérée', order);
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// ========================================
// GESTION ABONNEMENTS
// ========================================

exports.getAllSubscriptions = async (req, res) => {
  try {
    const { isActive, planType, page = 1, limit = 20 } = req.query;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (planType) where.planType = planType;

    const offset = (page - 1) * limit;

    const { count, rows: subscriptions } = await db.Subscription.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone', 'role', 'businessName'] },
        { model: db.Transaction, as: 'transaction' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return ResponseHandler.success(res, 'Abonnements récupérés', {
      subscriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération abonnements:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.getExpiringSubscriptions = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const subscriptions = await db.Subscription.findAll({
      where: {
        isActive: true,
        endDate: { [Op.between]: [now, futureDate] }
      },
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone', 'role', 'businessName'] }
      ],
      order: [['endDate', 'ASC']]
    });

    return ResponseHandler.success(res, 'Abonnements expirant bientôt', subscriptions);
  } catch (error) {
    console.error('Erreur récupération abonnements expirants:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// ========================================
// GESTION AVIS
// ========================================

exports.getAllReviews = async (req, res) => {
  try {
    const { rating, page = 1, limit = 20 } = req.query;

    const where = {};
    if (rating) where.rating = parseInt(rating);

    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await db.Review.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: db.User, as: 'seller', attributes: ['id', 'businessName', 'phone'] },
        { model: db.Order, as: 'order', attributes: ['id', 'orderNumber', 'total'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const allReviews = await db.Review.findAll({ attributes: ['rating'] });

    const stats = {
      total: allReviews.length,
      average: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    allReviews.forEach(r => { if (stats.distribution[r.rating] !== undefined) stats.distribution[r.rating]++; });

    return ResponseHandler.success(res, 'Avis récupérés', {
      reviews,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await db.Review.findByPk(id);

    if (!review) {
      return ResponseHandler.error(res, 'Avis non trouvé', 404);
    }

    const sellerId = review.sellerId;

    await review.destroy();

    await updateSellerRatingAdmin(sellerId);

    return ResponseHandler.success(res, 'Avis supprimé');
  } catch (error) {
    console.error('Erreur suppression avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// ========================================
// NOTIFICATIONS SYSTÈME
// ========================================

exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, targetRole, priority = 'medium' } = req.body;

    if (!title || !message) {
      return ResponseHandler.error(res, 'Titre et message requis', 400);
    }

    const where = { isActive: true };
    if (targetRole && targetRole !== 'all') where.role = targetRole;

    const users = await db.User.findAll({ where, attributes: ['id'] });

    const notifications = users.map(user => ({
      userId: user.id,
      type: 'system',
      title,
      message,
      priority
    }));

    await db.Notification.bulkCreate(notifications);

    return ResponseHandler.success(
      res,
      `Notification envoyée à ${users.length} utilisateur(s)`,
      { sentTo: users.length }
    );
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'envoi', 500);
  }
};

// ========================================
// FONCTIONS HELPER
// ========================================

async function updateSellerRatingAdmin(sellerId) {
  try {
    const reviews = await db.Review.findAll({
      where: { sellerId },
      attributes: ['rating']
    });

    if (reviews.length === 0) {
      await db.User.update({ averageRating: 0, totalReviews: 0 }, { where: { id: sellerId } });
      return;
    }

    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await db.User.update(
      { averageRating: parseFloat(average.toFixed(2)), totalReviews: reviews.length },
      { where: { id: sellerId } }
    );
  } catch (error) {
    console.error('Erreur mise à jour rating:', error);
  }
}

async function initializeFreeTrialsForExistingUsers(targetRole, freeTrialDays) {
  try {
    if (freeTrialDays <= 0) return;

    const role = targetRole === 'revendeur' ? 'revendeur' : 'client';

    const users = await db.User.findAll({
      where: { role, hasUsedFreeTrial: false, freeTrialStartDate: null }
    });

    if (users.length === 0) return;

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + freeTrialDays);

    const updates = [];
    const notifications = [];

    for (const user of users) {
      updates.push(user.update({ freeTrialStartDate: now, freeTrialEndDate: endDate, hasUsedFreeTrial: true }));
      notifications.push({
        userId: user.id,
        type: 'system',
        title: '🎁 Période d\'essai gratuite activée',
        message: `Profitez de ${freeTrialDays} jours d'accès gratuit ! Votre période d'essai expire le ${endDate.toLocaleDateString('fr-FR')}.`,
        priority: 'high',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await Promise.all(updates);

    if (notifications.length > 0) {
      await db.Notification.bulkCreate(notifications);
    }
  } catch (error) {
    console.error('❌ Erreur initialisation périodes d\'essai:', error);
  }
}