// ==========================================
// FICHIER: controllers/transactionController.js
// Gestion des transactions avec abonnements revendeurs et accès clients
// ==========================================

const { Transaction, User, Subscription, AccessPurchase, Order } = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');

/**
 * @desc    Créer une transaction pour abonnement revendeur
 */
exports.createSellerSubscriptionTransaction = async (userId, subscriptionId, amount, paymentMethod, metadata = {}) => {
  try {
    // Générer un numéro de transaction unique
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const transaction = await Transaction.create({
      userId,
      type: metadata.isRenewal 
        ? (metadata.isEarlyRenewal ? 'seller_early_renewal' : 'seller_subscription_renewal')
        : 'seller_subscription',
      amount,
      platformFee: 0, // Pas de commission sur abonnements revendeurs
      netAmount: amount,
      paymentMethod,
      subscriptionId,
      transactionNumber, // ✅ Numéro explicite
      description: metadata.description || `Abonnement revendeur - ${metadata.planType || 'Plan'}`,
      metadata: {
        planType: metadata.planType,
        duration: metadata.duration,
        isRenewal: metadata.isRenewal || false,
        isEarlyRenewal: metadata.isEarlyRenewal || false
      },
      status: 'completed', // Auto-validé pour l'instant
      completedAt: new Date()
    });

    console.log(`✅ Transaction créée: ${transaction.transactionNumber} - ${amount} FCFA`);
    return transaction;

  } catch (error) {
    console.error('❌ Erreur création transaction revendeur:', error);
    throw error;
  }
};

/**
 * @desc    Créer une transaction pour accès client 24h
 */
exports.createClientAccessTransaction = async (userId, accessPurchaseId, amount, paymentMethod, metadata = {}) => {
  try {
    // Générer un numéro de transaction unique
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const transaction = await Transaction.create({
      userId,
      type: 'client_access',
      amount,
      platformFee: 0, // Pas de commission sur accès clients
      netAmount: amount,
      paymentMethod,
      accessPurchaseId,
      transactionNumber, // ✅ Numéro explicite
      description: metadata.description || `Accès 24h - ${metadata.duration || 24}h`,
      metadata: {
        duration: metadata.duration || 24,
        accessType: '24h'
      },
      status: 'completed', // Auto-validé pour l'instant
      completedAt: new Date()
    });

    console.log(`✅ Transaction accès client créée: ${transaction.transactionNumber} - ${amount} FCFA`);
    return transaction;

  } catch (error) {
    console.error('❌ Erreur création transaction client:', error);
    throw error;
  }
};

/**
 * @desc    Obtenir toutes les transactions avec filtres améliorés
 * @route   GET /api/admin/transactions
 * @access  Private (admin)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const {
      status,
      type,
      userRole,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filtres
    if (status) where.status = status;
    if (type) where.type = type;
    
    if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { 
        ...where.createdAt, 
        [Op.lte]: new Date(endDate) 
      };
    }

    // Recherche par numéro de transaction ou téléphone
    if (search) {
      where[Op.or] = [
        { transactionNumber: { [Op.like]: `%${search}%` } },
        { paymentPhone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { rows: transactions, count } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'role', 'businessName'],
          where: userRole ? { role: userRole } : undefined
        },
        {
          model: Subscription,
          as: 'subscription',
          required: false,
          attributes: ['id', 'planType', 'duration', 'startDate', 'endDate']
        },
        {
          model: AccessPurchase,
          as: 'accessPurchase',
          required: false,
          attributes: ['id', 'durationHours', 'purchaseDate', 'expiryDate']
        },
        {
          model: Order,
          as: 'order',
          required: false,
          attributes: ['id', 'orderNumber', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`✅ ${transactions.length} transactions récupérées`);

    return ResponseHandler.success(res, 'Transactions récupérées', {
      transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Erreur getAllTransactions:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

/**
 * @desc    Obtenir les statistiques des transactions
 * @route   GET /api/admin/transactions/stats
 * @access  Private (admin)
 */
exports.getTransactionStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Transactions totales complétées
    const completedTransactions = await Transaction.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
        status: 'completed'
      },
      attributes: ['type', 'amount', 'createdAt']
    });

    const total = completedTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount), 
      0
    );
    const count = completedTransactions.length;

    // Statistiques par type de transaction
    const sellerSubscriptions = completedTransactions.filter(
      t => ['seller_subscription', 'seller_subscription_renewal', 'seller_early_renewal'].includes(t.type)
    );
    const clientAccess = completedTransactions.filter(
      t => t.type === 'client_access'
    );
    const orderPayments = completedTransactions.filter(
      t => t.type === 'order_payment'
    );

    const sellerSubTotal = sellerSubscriptions.reduce(
      (sum, t) => sum + parseFloat(t.amount), 
      0
    );
    const clientAccessTotal = clientAccess.reduce(
      (sum, t) => sum + parseFloat(t.amount), 
      0
    );
    const orderPaymentTotal = orderPayments.reduce(
      (sum, t) => sum + parseFloat(t.amount), 
      0
    );

    // Transactions en attente
    const pendingCount = await Transaction.count({
      where: { status: 'pending' }
    });

    // Évolution temporelle (par jour)
    const transactionsByDay = {};
    
    completedTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt).toLocaleDateString('fr-FR');
      if (!transactionsByDay[date]) {
        transactionsByDay[date] = {
          count: 0,
          amount: 0,
          sellerSub: 0,
          clientAccess: 0,
          orders: 0
        };
      }
      
      transactionsByDay[date].count++;
      transactionsByDay[date].amount += parseFloat(transaction.amount);
      
      if (['seller_subscription', 'seller_subscription_renewal', 'seller_early_renewal'].includes(transaction.type)) {
        transactionsByDay[date].sellerSub += parseFloat(transaction.amount);
      } else if (transaction.type === 'client_access') {
        transactionsByDay[date].clientAccess += parseFloat(transaction.amount);
      } else if (transaction.type === 'order_payment') {
        transactionsByDay[date].orders += parseFloat(transaction.amount);
      }
    });

    const timelineData = Object.keys(transactionsByDay)
      .sort()
      .map(date => ({
        date,
        ...transactionsByDay[date]
      }));

    const stats = {
      overview: {
        total: parseFloat(total.toFixed(2)),
        count,
        average: count > 0 ? parseFloat((total / count).toFixed(2)) : 0,
        pending: pendingCount
      },
      byType: {
        sellerSubscriptions: {
          count: sellerSubscriptions.length,
          total: parseFloat(sellerSubTotal.toFixed(2)),
          percentage: total > 0 ? parseFloat(((sellerSubTotal / total) * 100).toFixed(1)) : 0
        },
        clientAccess: {
          count: clientAccess.length,
          total: parseFloat(clientAccessTotal.toFixed(2)),
          percentage: total > 0 ? parseFloat(((clientAccessTotal / total) * 100).toFixed(1)) : 0
        },
        orderPayments: {
          count: orderPayments.length,
          total: parseFloat(orderPaymentTotal.toFixed(2)),
          percentage: total > 0 ? parseFloat(((orderPaymentTotal / total) * 100).toFixed(1)) : 0
        }
      },
      timeline: timelineData
    };

    console.log('✅ Statistiques transactions calculées');

    return ResponseHandler.success(res, 'Statistiques récupérées', stats);

  } catch (error) {
    console.error('❌ Erreur getTransactionStats:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

/**
 * @desc    Valider une transaction en attente
 * @route   PUT /api/admin/transactions/:id/validate
 * @access  Private (admin)
 */
exports.validateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Subscription, as: 'subscription' },
        { model: AccessPurchase, as: 'accessPurchase' },
        { model: Order, as: 'order' }
      ]
    });

    if (!transaction) {
      return ResponseHandler.error(res, 'Transaction non trouvée', 404);
    }

    if (!transaction.canBeValidated()) {
      return ResponseHandler.error(
        res,
        'Cette transaction ne peut pas être validée',
        400
      );
    }

    // Marquer comme complétée
    await transaction.markAsCompleted(adminId);

    // Activer l'entité associée
    if (transaction.subscription) {
      await transaction.subscription.update({
        status: 'active',
        isActive: true
      });
      
      await transaction.user.update({
        hasActiveSubscription: true,
        subscriptionEndDate: transaction.subscription.endDate
      });
    }

    if (transaction.accessPurchase) {
      await transaction.accessPurchase.update({
        status: 'completed',
        isActive: true
      });
      
      await transaction.user.update({
        hasActiveAccess: true,
        accessExpiryDate: transaction.accessPurchase.expiryDate
      });
    }

    if (transaction.order) {
      await transaction.order.update({
        paymentStatus: 'paid'
      });
    }

    console.log(`✅ Transaction ${transaction.transactionNumber} validée par admin`);

    return ResponseHandler.success(
      res,
      'Transaction validée avec succès',
      transaction
    );

  } catch (error) {
    console.error('❌ Erreur validateTransaction:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

/**
 * @desc    Obtenir le détail d'une transaction
 * @route   GET /api/admin/transactions/:id
 * @access  Private (admin)
 */
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'role', 'businessName']
        },
        {
          model: Subscription,
          as: 'subscription',
          attributes: ['id', 'planType', 'duration', 'startDate', 'endDate', 'status']
        },
        {
          model: AccessPurchase,
          as: 'accessPurchase',
          attributes: ['id', 'durationHours', 'purchaseDate', 'expiryDate', 'status']
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status', 'total']
        },
        {
          model: User,
          as: 'validator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    if (!transaction) {
      return ResponseHandler.error(res, 'Transaction non trouvée', 404);
    }

    console.log(`✅ Transaction ${transaction.transactionNumber} récupérée`);

    return ResponseHandler.success(res, 'Transaction récupérée', transaction);

  } catch (error) {
    console.error('❌ Erreur getTransactionById:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

/**
 * @desc    Annuler une transaction en attente
 * @route   PUT /api/admin/transactions/:id/cancel
 * @access  Private (admin)
 */
exports.cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return ResponseHandler.error(res, 'Transaction non trouvée', 404);
    }

    if (transaction.status !== 'pending') {
      return ResponseHandler.error(
        res,
        'Seules les transactions en attente peuvent être annulées',
        400
      );
    }

    await transaction.update({
      status: 'cancelled',
      failureReason: reason || 'Annulée par l\'administrateur',
      failedAt: new Date()
    });

    console.log(`✅ Transaction ${transaction.transactionNumber} annulée`);

    return ResponseHandler.success(
      res,
      'Transaction annulée avec succès',
      transaction
    );

  } catch (error) {
    console.error('❌ Erreur cancelTransaction:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

/**
 * @desc    Exporter les transactions en CSV
 * @route   GET /api/admin/transactions/export
 * @access  Private (admin)
 */
exports.exportTransactions = async (req, res) => {
  try {
    const { startDate, endDate, status, type } = req.query;
    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'phone', 'role', 'businessName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Générer CSV
    const csv = [
      ['Date', 'Référence', 'Utilisateur', 'Téléphone', 'Rôle', 'Type', 'Montant', 'Statut'].join(','),
      ...transactions.map(t => [
        new Date(t.createdAt).toLocaleString('fr-FR'),
        t.transactionNumber,
        t.user.role === 'revendeur' 
          ? t.user.businessName 
          : `${t.user.firstName} ${t.user.lastName}`,
        t.user.phone,
        t.user.role === 'revendeur' ? 'Revendeur' : 'Client',
        t.type,
        t.amount,
        t.status
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    
    console.log(`✅ Export de ${transactions.length} transactions`);
    
    return res.send(csv);

  } catch (error) {
    console.error('❌ Erreur exportTransactions:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

module.exports = exports;