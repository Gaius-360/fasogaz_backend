// ==========================================
// FICHIER: controllers/adminWalletController.js
// Gestion du portefeuille administrateur avec transactions
// ==========================================

const { Transaction, User, Subscription, AccessPurchase, AdminWithdrawal } = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');

/**
 * @desc    Obtenir le solde du portefeuille administrateur
 * @route   GET /api/admin/wallet/balance
 * @access  Private (admin)
 */
exports.getWalletBalance = async (req, res) => {
  try {
    // 1️⃣ REVENUS TOTAUX (toutes transactions complétées)
    const completedTransactions = await Transaction.findAll({
      where: {
        status: 'completed'
      },
      attributes: ['amount', 'type', 'createdAt', 'netAmount']
    });

    const totalRevenue = completedTransactions.reduce(
      (sum, t) => sum + parseFloat(t.netAmount || t.amount),
      0
    );

    // 2️⃣ REVENUS PAR TYPE
    const sellerSubscriptionRevenue = completedTransactions
      .filter(t => ['seller_subscription', 'seller_subscription_renewal', 'seller_early_renewal'].includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.netAmount || t.amount), 0);

    const clientAccessRevenue = completedTransactions
      .filter(t => t.type === 'client_access')
      .reduce((sum, t) => sum + parseFloat(t.netAmount || t.amount), 0);

    const orderRevenue = completedTransactions
      .filter(t => t.type === 'order_payment')
      .reduce((sum, t) => sum + parseFloat(t.netAmount || t.amount), 0);

    // 3️⃣ RETRAITS EFFECTUÉS
    let totalWithdrawn = 0;
    let pendingWithdrawals = 0;

    try {
      const withdrawals = await AdminWithdrawal.findAll({
        where: {
          status: 'completed'
        },
        attributes: ['amount']
      });

      totalWithdrawn = withdrawals.reduce(
        (sum, w) => sum + parseFloat(w.amount),
        0
      );

      // Retraits en attente
      const pending = await AdminWithdrawal.findAll({
        where: {
          status: 'pending'
        },
        attributes: ['amount']
      });

      pendingWithdrawals = pending.reduce(
        (sum, w) => sum + parseFloat(w.amount),
        0
      );
    } catch (error) {
      console.log('⚠️ Table AdminWithdrawal non trouvée, retraits = 0');
    }

    // 4️⃣ SOLDE DISPONIBLE
    const availableBalance = totalRevenue - totalWithdrawn - pendingWithdrawals;

    // 5️⃣ STATISTIQUES CE MOIS
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthTransactions = completedTransactions.filter(
      t => new Date(t.createdAt) >= startOfMonth
    );

    const thisMonthRevenue = thisMonthTransactions.reduce(
      (sum, t) => sum + parseFloat(t.netAmount || t.amount),
      0
    );

    const thisMonthSellerSubs = thisMonthTransactions
      .filter(t => ['seller_subscription', 'seller_subscription_renewal', 'seller_early_renewal'].includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.netAmount || t.amount), 0);

    const thisMonthClientAccess = thisMonthTransactions
      .filter(t => t.type === 'client_access')
      .reduce((sum, t) => sum + parseFloat(t.netAmount || t.amount), 0);

    // 6️⃣ STATISTIQUES AUJOURD'HUI
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = completedTransactions.filter(
      t => {
        const tDate = new Date(t.createdAt);
        return tDate >= today && tDate < tomorrow;
      }
    );

    const todayRevenue = todayTransactions.reduce(
      (sum, t) => sum + parseFloat(t.netAmount || t.amount),
      0
    );

    // 7️⃣ CONSTRUIRE LA RÉPONSE
    const balance = {
      overview: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
        pendingWithdrawals: parseFloat(pendingWithdrawals.toFixed(2)),
        availableBalance: parseFloat(availableBalance.toFixed(2))
      },
      
      bySource: {
        sellerSubscriptions: {
          total: parseFloat(sellerSubscriptionRevenue.toFixed(2)),
          percentage: totalRevenue > 0 
            ? parseFloat(((sellerSubscriptionRevenue / totalRevenue) * 100).toFixed(1)) 
            : 0
        },
        clientAccess: {
          total: parseFloat(clientAccessRevenue.toFixed(2)),
          percentage: totalRevenue > 0 
            ? parseFloat(((clientAccessRevenue / totalRevenue) * 100).toFixed(1)) 
            : 0
        },
        orderPayments: {
          total: parseFloat(orderRevenue.toFixed(2)),
          percentage: totalRevenue > 0 
            ? parseFloat(((orderRevenue / totalRevenue) * 100).toFixed(1)) 
            : 0
        }
      },

      thisMonth: {
        total: parseFloat(thisMonthRevenue.toFixed(2)),
        sellerSubscriptions: parseFloat(thisMonthSellerSubs.toFixed(2)),
        clientAccess: parseFloat(thisMonthClientAccess.toFixed(2)),
        transactionCount: thisMonthTransactions.length
      },

      today: {
        revenue: parseFloat(todayRevenue.toFixed(2)),
        transactionCount: todayTransactions.length
      },

      lastUpdate: new Date()
    };

    console.log('✅ Solde du portefeuille calculé');
    console.log(`💰 Total: ${balance.overview.totalRevenue} FCFA`);
    console.log(`💵 Disponible: ${balance.overview.availableBalance} FCFA`);

    return ResponseHandler.success(
      res,
      'Solde du portefeuille récupéré',
      balance
    );

  } catch (error) {
    console.error('❌ Erreur récupération solde:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

/**
 * @desc    Obtenir l'historique des retraits
 * @route   GET /api/admin/wallet/withdrawals
 * @access  Private (admin)
 */
exports.getWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    // Vérifier si la table AdminWithdrawal existe
    const { count, rows: withdrawals } = await AdminWithdrawal.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`✅ ${withdrawals.length} retraits récupérés`);

    return ResponseHandler.success(
      res,
      'Historique des retraits récupéré',
      {
        withdrawals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    );

  } catch (error) {
    console.error('❌ Erreur récupération retraits:', error);
    
    // Si la table n'existe pas
    if (error.name === 'SequelizeDatabaseError') {
      return ResponseHandler.success(
        res,
        'Aucun retrait enregistré',
        {
          withdrawals: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        }
      );
    }
    
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

/**
 * @desc    Demander un retrait
 * @route   POST /api/admin/wallet/withdraw
 * @access  Private (admin)
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    const adminId = req.admin.id;

    // Validation
    if (!amount || !method || !details) {
      return ResponseHandler.error(
        res,
        'Montant, méthode de paiement et détails du compte requis',
        400
      );
    }

    const withdrawalAmount = parseFloat(amount);

    if (withdrawalAmount < 50000) {
      return ResponseHandler.error(
        res,
        'Le montant minimum de retrait est de 50,000 FCFA',
        400
      );
    }

    // Vérifier le solde disponible
    const completedTransactions = await Transaction.findAll({
      where: { status: 'completed' },
      attributes: ['amount', 'netAmount']
    });

    const totalRevenue = completedTransactions.reduce(
      (sum, t) => sum + parseFloat(t.netAmount || t.amount),
      0
    );

    let totalWithdrawn = 0;

    try {
      const withdrawals = await AdminWithdrawal.findAll({
        where: {
          status: { [Op.in]: ['completed', 'pending'] }
        },
        attributes: ['amount']
      });

      totalWithdrawn = withdrawals.reduce(
        (sum, w) => sum + parseFloat(w.amount),
        0
      );
    } catch (error) {
      console.log('⚠️ Table AdminWithdrawal non trouvée');
    }

    const availableBalance = totalRevenue - totalWithdrawn;

    if (withdrawalAmount > availableBalance) {
      return ResponseHandler.error(
        res,
        `Solde insuffisant. Disponible: ${availableBalance.toFixed(2)} FCFA`,
        400
      );
    }

    // Créer la demande de retrait
    const withdrawal = await AdminWithdrawal.create({
      amount: withdrawalAmount,
      paymentMethod: method,
      accountDetails: details,
      status: 'pending',
      requestedBy: adminId,
      requestedAt: new Date()
    });

    console.log(`✅ Demande de retrait créée: ${withdrawalAmount} FCFA`);

    return ResponseHandler.success(
      res,
      'Demande de retrait créée avec succès',
      withdrawal
    );

  } catch (error) {
    console.error('❌ Erreur création retrait:', error);
    return ResponseHandler.error(res, 'Erreur lors de la création', 500);
  }
};

/**
 * @desc    Obtenir les statistiques détaillées du portefeuille
 * @route   GET /api/admin/wallet/stats
 * @access  Private (admin)
 */
exports.getWalletStats = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let startDate = new Date();
    
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    }

    // Transactions de la période
    const transactions = await Transaction.findAll({
      where: {
        status: 'completed',
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['amount', 'netAmount', 'type', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    // Grouper par jour
    const revenueByDay = {};
    
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString('fr-FR');
      if (!revenueByDay[date]) {
        revenueByDay[date] = {
          total: 0,
          sellerSubs: 0,
          clientAccess: 0,
          orders: 0
        };
      }
      
      const amount = parseFloat(t.netAmount || t.amount);
      revenueByDay[date].total += amount;
      
      if (['seller_subscription', 'seller_subscription_renewal', 'seller_early_renewal'].includes(t.type)) {
        revenueByDay[date].sellerSubs += amount;
      } else if (t.type === 'client_access') {
        revenueByDay[date].clientAccess += amount;
      } else if (t.type === 'order_payment') {
        revenueByDay[date].orders += amount;
      }
    });

    const chartData = Object.keys(revenueByDay)
      .sort()
      .map(date => ({
        date,
        ...revenueByDay[date]
      }));

    console.log('✅ Statistiques portefeuille calculées');

    return ResponseHandler.success(
      res,
      'Statistiques récupérées',
      {
        period,
        totalRevenue: transactions.reduce((sum, t) => sum + parseFloat(t.netAmount || t.amount), 0),
        transactionCount: transactions.length,
        chartData
      }
    );

  } catch (error) {
    console.error('❌ Erreur statistiques portefeuille:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

module.exports = exports;