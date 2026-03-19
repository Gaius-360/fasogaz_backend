// ==========================================
// FICHIER: controllers/paymentController.js
// ✅ Types acceptés :
//    'subscription'        → abonnement revendeur
//    'client_subscription' → abonnement client (accès tous les revendeurs)
// ✅ AJOUT: notifyPaymentConfirmed après activation de chaque abonnement
// ==========================================

const ligdicashService    = require('../services/ligdicashService');
const { Transaction, User, Subscription, Pricing } = require('../models');
const ResponseHandler     = require('../utils/responseHandler');
const NotificationService = require('../utils/notificationService');

/**
 * @desc    Initier un paiement LigdiCash
 * @route   POST /api/payments/initiate
 * @access  Private
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { amount, type, metadata } = req.body;
    const userId = req.user.id;

    console.log('💳 Initiation paiement:', { userId, amount, type });

    if (!amount || amount <= 0) {
      return ResponseHandler.error(res, 'Montant invalide', 400);
    }

    if (!type || !['subscription', 'client_subscription'].includes(type)) {
      return ResponseHandler.error(res, 'Type de paiement invalide (subscription | client_subscription)', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const description = type === 'client_subscription'
      ? `Abonnement client — ${_planLabel(metadata?.planType)}`
      : `Abonnement revendeur — ${_planLabel(metadata?.planType)}`;

    const customerName = user.role === 'revendeur'
      ? (user.businessName || `${user.firstName} ${user.lastName}`)
      : `${user.firstName} ${user.lastName}`;

    const paymentData = {
      amount,
      description,
      customerName,
      customerEmail: user.email,
      customerPhone: user.phone,
      orderId:       transactionId,
      metadata:      { userId, type, userRole: user.role, ...metadata }
    };

    const paymentResult = await ligdicashService.createPayment(paymentData);
    if (!paymentResult.success) {
      return ResponseHandler.error(res, 'Erreur création paiement LigdiCash', 500);
    }

    const txType = type === 'client_subscription' ? 'client_subscription' : 'seller_subscription';

    const transaction = await Transaction.create({
      userId,
      type:              txType,
      amount,
      paymentMethod:     'ligdicash',
      transactionNumber: transactionId,
      ligdicashToken:    paymentResult.token,
      ligdicashOrderId:  paymentResult.orderId,
      description,
      metadata:          paymentData.metadata,
      status:            'pending',
      isSimulation:      paymentResult.isSimulation || false
    });

    console.log('✅ Transaction créée:', { id: transaction.id, token: paymentResult.token });

    return ResponseHandler.success(res, 'Paiement initié', {
      transactionId:     transaction.id,
      transactionNumber: transactionId,
      paymentUrl:        paymentResult.paymentUrl,
      token:             paymentResult.token,
      isSimulation:      paymentResult.isSimulation || false
    });

  } catch (error) {
    console.error('❌ Erreur initiation paiement:', error);
    return ResponseHandler.error(res, error.message || 'Erreur paiement', 500);
  }
};

/**
 * @desc    Callback webhook LigdiCash (serveur → serveur)
 * @route   POST /api/payments/ligdicash/callback
 * @access  Public (sécurisé par signature)
 */
exports.handleCallback = async (req, res) => {
  try {
    console.log('📥 Callback LigdiCash:', req.body);

    const signature = req.headers['x-ligdicash-signature'];
    const payload   = req.body;

    if (process.env.NODE_ENV === 'production' &&
        !ligdicashService.verifyWebhookSignature(payload, signature)) {
      console.error('❌ Signature invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const { token, status } = payload;

    const transaction = await Transaction.findOne({ where: { ligdicashToken: token } });
    if (!transaction) {
      console.error('❌ Transaction non trouvée:', token);
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    if (status === 'completed' || status === 'success') {
      await _processSuccessfulPayment(transaction);
    } else if (status === 'failed' || status === 'cancelled') {
      await transaction.update({ status: 'failed', failedAt: new Date() });
    }

    return res.status(200).json({ message: 'Callback traité' });

  } catch (error) {
    console.error('❌ Erreur callback:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * @desc    Retour utilisateur après paiement (redirection navigateur)
 * @route   GET /api/payments/ligdicash/return
 * @access  Public
 */
exports.handleReturn = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(`${process.env.APP_URL}/payment/error?message=Token manquant`);
    }

    const transaction = await Transaction.findOne({ where: { ligdicashToken: token } });
    if (!transaction) {
      return res.redirect(`${process.env.APP_URL}/payment/error?message=Transaction non trouvée`);
    }

    const paymentStatus = await ligdicashService.checkPaymentStatus(token);

    if (paymentStatus.status === 'completed' || paymentStatus.status === 'success') {
      if (transaction.status === 'pending') {
        await _processSuccessfulPayment(transaction);
      }
      return res.redirect(`${process.env.APP_URL}/payment/success?transaction=${transaction.transactionNumber}`);
    }

    return res.redirect(`${process.env.APP_URL}/payment/pending?transaction=${transaction.transactionNumber}`);

  } catch (error) {
    console.error('❌ Erreur retour:', error);
    return res.redirect(`${process.env.APP_URL}/payment/error?message=${encodeURIComponent(error.message)}`);
  }
};

/**
 * @desc    Vérifier le statut d'une transaction
 * @route   GET /api/payments/status/:transactionNumber
 * @access  Private
 */
exports.checkStatus = async (req, res) => {
  try {
    const { transactionNumber } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ where: { transactionNumber, userId } });
    if (!transaction) return ResponseHandler.error(res, 'Transaction non trouvée', 404);

    // Si encore pending, interroger LigdiCash
    if (transaction.status === 'pending' && transaction.ligdicashToken) {
      const paymentStatus = await ligdicashService.checkPaymentStatus(transaction.ligdicashToken);
      if (paymentStatus.status === 'completed' || paymentStatus.status === 'success') {
        await _processSuccessfulPayment(transaction);
      }
    }

    // Recharger après mise à jour éventuelle
    await transaction.reload();

    return ResponseHandler.success(res, 'Statut récupéré', {
      status:      transaction.status,
      amount:      transaction.amount,
      createdAt:   transaction.createdAt,
      completedAt: transaction.completedAt
    });

  } catch (error) {
    console.error('❌ Erreur vérification statut:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// ── Logique interne ───────────────────────────────────────────────────────────

async function _processSuccessfulPayment(transaction) {
  // Éviter le double-traitement
  if (transaction.status === 'completed') return;

  await transaction.update({ status: 'completed', completedAt: new Date() });

  const metadata = { ...transaction.metadata, amount: transaction.amount };

  if (transaction.type === 'seller_subscription') {
    await _activateSellerSubscription(transaction.userId, metadata, transaction.transactionNumber);
  } else if (transaction.type === 'client_subscription') {
    await _activateClientSubscription(transaction.userId, metadata, transaction.transactionNumber);
  }

  console.log(`✅ Paiement traité: ${transaction.transactionNumber}`);
}

/**
 * Activer un abonnement revendeur
 * ✅ AJOUT: notifyPaymentConfirmed après activation
 */
async function _activateSellerSubscription(userId, metadata, transactionNumber) {
  const pricingConfig = await Pricing.findOne({ where: { targetRole: 'revendeur' } });
  if (!pricingConfig) return;

  const planType   = metadata.planType || 'monthly';
  const planConfig = pricingConfig.plans?.[planType];
  if (!planConfig) { console.error('❌ Plan revendeur introuvable:', planType); return; }

  const startDate = new Date();
  const endDate   = new Date();
  endDate.setDate(endDate.getDate() + planConfig.duration);

  await Subscription.create({
    userId,
    planType,
    amount:        parseFloat(metadata.amount || planConfig.price),
    duration:      planConfig.duration,
    startDate,
    endDate,
    paymentMethod: 'ligdicash',
    status:        'active',
    isActive:      true
  });

  await User.update(
    { subscriptionEndDate: endDate, hasActiveSubscription: true, hasActiveAccess: true },
    { where: { id: userId } }
  );

  // ✅ Notification push + BDD au revendeur
  await NotificationService.notifyPaymentConfirmed(userId, {
    amount:            metadata.amount,
    transactionNumber,
    planType,
    planLabel:         _planLabel(planType),
    endDate:           endDate.toLocaleDateString('fr-FR'),
    type:              'seller_subscription',
  });

  console.log(`✅ Abonnement revendeur activé — user ${userId} jusqu'au ${endDate.toLocaleDateString('fr-FR')}`);
}

/**
 * Activer un abonnement client (accès à tous les revendeurs)
 * ✅ AJOUT: notifyPaymentConfirmed après activation
 */
async function _activateClientSubscription(userId, metadata, transactionNumber) {
  const pricingConfig = await Pricing.findOne({ where: { targetRole: 'client' } });
  if (!pricingConfig) return;

  const planType   = metadata.planType || 'monthly';
  const planConfig = pricingConfig.plans?.[planType];
  if (!planConfig) { console.error('❌ Plan client introuvable:', planType); return; }

  const startDate = new Date();
  const endDate   = new Date();
  endDate.setDate(endDate.getDate() + planConfig.duration);

  await Subscription.create({
    userId,
    planType,
    amount:        parseFloat(metadata.amount || planConfig.price),
    duration:      planConfig.duration,
    startDate,
    endDate,
    paymentMethod: 'ligdicash',
    status:        'active',
    isActive:      true
  });

  await User.update(
    { subscriptionEndDate: endDate, hasActiveSubscription: true, hasActiveAccess: true },
    { where: { id: userId } }
  );

  // ✅ Notification push + BDD au client
  await NotificationService.notifyPaymentConfirmed(userId, {
    amount:            metadata.amount,
    transactionNumber,
    planType,
    planLabel:         _planLabel(planType),
    endDate:           endDate.toLocaleDateString('fr-FR'),
    type:              'client_subscription',
  });

  console.log(`✅ Abonnement client activé — user ${userId} jusqu'au ${endDate.toLocaleDateString('fr-FR')}`);
}

function _planLabel(planType) {
  const labels = { weekly: 'Hebdomadaire', monthly: 'Mensuel', quarterly: 'Trimestriel', yearly: 'Annuel' };
  return labels[planType] || planType || 'Standard';
}

module.exports = exports;