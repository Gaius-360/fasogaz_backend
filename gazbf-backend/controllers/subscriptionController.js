// ==========================================
// FICHIER: controllers/subscriptionController.js
// ==========================================
const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// Plans disponibles
const SUBSCRIPTION_PLANS = {
  // Clients
  client_week: { price: 250, duration: 7, name: 'Client - 1 Semaine' },
  client_month: { price: 800, duration: 30, name: 'Client - 1 Mois' },
  
  // Revendeurs
  seller_free: { price: 0, duration: 30, name: 'Découverte - 30 jours' },
  seller_standard: { price: 3000, duration: 30, name: 'Standard' },
  seller_pro: { price: 7000, duration: 30, name: 'Pro' },
  seller_enterprise: { price: 15000, duration: 30, name: 'Entreprise' }
};

// @desc    Obtenir les plans disponibles
// @route   GET /api/subscriptions/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    const { role } = req.query;

    let plans = SUBSCRIPTION_PLANS;

    // Filtrer par rôle si spécifié
    if (role === 'client') {
      plans = {
        client_week: SUBSCRIPTION_PLANS.client_week,
        client_month: SUBSCRIPTION_PLANS.client_month
      };
    } else if (role === 'revendeur') {
      plans = {
        seller_free: SUBSCRIPTION_PLANS.seller_free,
        seller_standard: SUBSCRIPTION_PLANS.seller_standard,
        seller_pro: SUBSCRIPTION_PLANS.seller_pro,
        seller_enterprise: SUBSCRIPTION_PLANS.seller_enterprise
      };
    }

    return ResponseHandler.success(res, 'Plans disponibles', plans);
  } catch (error) {
    console.error('Erreur récupération plans:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Créer un abonnement
// @route   POST /api/subscriptions
// @access  Private
exports.createSubscription = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { planType, paymentMethod, paymentPhone } = req.body;

    // Vérifier que le plan existe
    if (!SUBSCRIPTION_PLANS[planType]) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Plan invalide', 400);
    }

    const plan = SUBSCRIPTION_PLANS[planType];

    // Vérifier la cohérence rôle/plan
    const isClientPlan = planType.startsWith('client_');
    const isSellerPlan = planType.startsWith('seller_');

    if (req.user.role === 'client' && !isClientPlan) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Plan non disponible pour les clients', 400);
    }

    if (req.user.role === 'revendeur' && !isSellerPlan) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Plan non disponible pour les revendeurs', 400);
    }

    // Vérifier s'il y a déjà un abonnement actif
    const existingSubscription = await db.Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (existingSubscription && existingSubscription.isActive) {
      const endDate = new Date(existingSubscription.endDate);
      if (endDate > new Date()) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          `Vous avez déjà un abonnement actif jusqu'au ${endDate.toLocaleDateString('fr-FR')}`,
          400
        );
      }
    }

    // Calculer les dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Créer la transaction de paiement
    const transactionRecord = await db.Transaction.create({
      userId: req.user.id,
      type: 'subscription',
      amount: plan.price,
      paymentMethod,
      paymentPhone,
      status: plan.price === 0 ? 'completed' : 'pending',
      metadata: {
        planType,
        planName: plan.name,
        duration: plan.duration
      }
    }, { transaction });

    // Si gratuit, créer l'abonnement directement
    if (plan.price === 0) {
      if (existingSubscription) {
        await existingSubscription.update({
          planType,
          startDate,
          endDate,
          isActive: true,
          price: plan.price
        }, { transaction });
      } else {
        await db.Subscription.create({
          userId: req.user.id,
          planType,
          startDate,
          endDate,
          isActive: true,
          price: plan.price
        }, { transaction });
      }

      await transaction.commit();

      return ResponseHandler.success(
        res,
        'Abonnement gratuit activé',
        {
          subscription: await db.Subscription.findOne({ where: { userId: req.user.id } }),
          transaction: transactionRecord
        },
        201
      );
    }

    // Pour les abonnements payants, retourner les infos de paiement
    await transaction.commit();

    return ResponseHandler.success(
      res,
      'Transaction créée. En attente du paiement.',
      {
        transaction: transactionRecord,
        paymentInstructions: {
          method: paymentMethod,
          amount: plan.price,
          reference: transactionRecord.transactionRef,
          message: `Procédez au paiement de ${plan.price} FCFA via ${paymentMethod} au numéro ${paymentPhone}. Référence: ${transactionRecord.transactionRef}`
        }
      },
      201
    );
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur création abonnement:', error);
    return ResponseHandler.error(res, 'Erreur lors de la création', 500);
  }
};

// @desc    Confirmer un paiement (simulé)
// @route   POST /api/subscriptions/confirm-payment
// @access  Private
exports.confirmPayment = async (req, res) => {
  const dbTransaction = await db.sequelize.transaction();

  try {
    const { transactionRef, externalRef } = req.body;

    if (!transactionRef) {
      await dbTransaction.rollback();
      return ResponseHandler.error(res, 'Référence de transaction requise', 400);
    }

    // Récupérer la transaction
    const transaction = await db.Transaction.findOne({
      where: { 
        transactionRef,
        userId: req.user.id,
        status: 'pending'
      }
    });

    if (!transaction) {
      await dbTransaction.rollback();
      return ResponseHandler.error(res, 'Transaction non trouvée ou déjà traitée', 404);
    }

    // Mettre à jour la transaction
    await transaction.update({
      status: 'completed',
      externalRef: externalRef || null
    }, { transaction: dbTransaction });

    // Créer ou mettre à jour l'abonnement
    const planType = transaction.metadata.planType;
    const plan = SUBSCRIPTION_PLANS[planType];

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    const existingSubscription = await db.Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (existingSubscription) {
      await existingSubscription.update({
        planType,
        startDate,
        endDate,
        isActive: true,
        price: plan.price
      }, { transaction: dbTransaction });
    } else {
      await db.Subscription.create({
        userId: req.user.id,
        planType,
        startDate,
        endDate,
        isActive: true,
        price: plan.price
      }, { transaction: dbTransaction });
    }

    await dbTransaction.commit();

    return ResponseHandler.success(
      res,
      'Paiement confirmé et abonnement activé',
      {
        subscription: await db.Subscription.findOne({ where: { userId: req.user.id } })
      }
    );
  } catch (error) {
    await dbTransaction.rollback();
    console.error('Erreur confirmation paiement:', error);
    return ResponseHandler.error(res, 'Erreur lors de la confirmation', 500);
  }
};

// @desc    Obtenir mon abonnement
// @route   GET /api/subscriptions/my-subscription
// @access  Private
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await db.Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription) {
      return ResponseHandler.success(res, 'Aucun abonnement', null);
    }

    // Vérifier l'expiration
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const isExpired = endDate < now;

    if (isExpired && subscription.isActive) {
      await subscription.update({ isActive: false });
    }

    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    return ResponseHandler.success(
      res,
      'Abonnement récupéré',
      {
        subscription,
        status: {
          isExpired,
          daysRemaining: isExpired ? 0 : daysRemaining,
          willExpireSoon: daysRemaining <= 3 && daysRemaining > 0
        }
      }
    );
  } catch (error) {
    console.error('Erreur récupération abonnement:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Annuler le renouvellement automatique
// @route   PUT /api/subscriptions/cancel-auto-renew
// @access  Private
exports.cancelAutoRenew = async (req, res) => {
  try {
    const subscription = await db.Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription) {
      return ResponseHandler.error(res, 'Aucun abonnement trouvé', 404);
    }

    await subscription.update({ autoRenew: false });

    return ResponseHandler.success(
      res,
      'Renouvellement automatique annulé',
      subscription
    );
  } catch (error) {
    console.error('Erreur annulation auto-renew:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'annulation', 500);
  }
};

// @desc    Activer le renouvellement automatique
// @route   PUT /api/subscriptions/enable-auto-renew
// @access  Private
exports.enableAutoRenew = async (req, res) => {
  try {
    const subscription = await db.Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription) {
      return ResponseHandler.error(res, 'Aucun abonnement trouvé', 404);
    }

    await subscription.update({ autoRenew: true });

    return ResponseHandler.success(
      res,
      'Renouvellement automatique activé',
      subscription
    );
  } catch (error) {
    console.error('Erreur activation auto-renew:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'activation', 500);
  }
};

// @desc    Historique des transactions
// @route   GET /api/subscriptions/transactions
// @access  Private
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await db.Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total: transactions.length,
      completed: transactions.filter(t => t.status === 'completed').length,
      pending: transactions.filter(t => t.status === 'pending').length,
      failed: transactions.filter(t => t.status === 'failed').length,
      totalSpent: transactions
        .filter(t => t.status === 'completed' && t.type === 'subscription')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    };

    return ResponseHandler.success(
      res,
      'Historique des transactions',
      {
        transactions,
        stats
      }
    );
  } catch (error) {
    console.error('Erreur récupération transactions:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

module.exports = exports;