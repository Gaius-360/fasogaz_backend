// ==========================================
// FICHIER: controllers/paymentController.js
// Gestion des paiements LigdiCash
// ==========================================

const ligdicashService = require('../services/ligdicashService');
const { Transaction, User, Subscription, AccessPurchase } = require('../models');
const ResponseHandler = require('../utils/responseHandler');

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

    // Validation
    if (!amount || amount <= 0) {
      return ResponseHandler.error(res, 'Montant invalide', 400);
    }

    if (!type || !['subscription', 'access'].includes(type)) {
      return ResponseHandler.error(res, 'Type de paiement invalide', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    // Générer un ID de transaction unique
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Préparer les données du paiement
    const paymentData = {
      amount,
      description: type === 'subscription' 
        ? `Abonnement revendeur - ${metadata?.planType || 'Plan'}` 
        : 'Accès 24h client',
      customerName: user.role === 'revendeur' 
        ? user.businessName 
        : `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      customerPhone: user.phone,
      orderId: transactionId,
      metadata: {
        userId,
        type,
        userRole: user.role,
        ...metadata
      }
    };

    // Créer le paiement avec LigdiCash
    const paymentResult = await ligdicashService.createPayment(paymentData);

    if (!paymentResult.success) {
      return ResponseHandler.error(res, 'Erreur création paiement', 500);
    }

    // Créer la transaction en base de données (statut pending)
    const transaction = await Transaction.create({
      userId,
      type: type === 'subscription' ? 'seller_subscription' : 'client_access',
      amount,
      paymentMethod: 'ligdicash',
      transactionNumber: transactionId,
      ligdicashToken: paymentResult.token,
      ligdicashOrderId: paymentResult.orderId,
      description: paymentData.description,
      metadata: paymentData.metadata,
      status: 'pending',
      isSimulation: paymentResult.isSimulation || false
    });

    console.log('✅ Transaction créée:', {
      id: transaction.id,
      token: paymentResult.token,
      isSimulation: paymentResult.isSimulation
    });

    return ResponseHandler.success(res, 'Paiement initié', {
      transactionId: transaction.id,
      transactionNumber: transactionId,
      paymentUrl: paymentResult.paymentUrl,
      token: paymentResult.token,
      isSimulation: paymentResult.isSimulation || false
    });

  } catch (error) {
    console.error('❌ Erreur initiation paiement:', error);
    return ResponseHandler.error(
      res, 
      error.message || 'Erreur lors de l\'initiation du paiement',
      500
    );
  }
};

/**
 * @desc    Callback webhook LigdiCash (notification serveur à serveur)
 * @route   POST /api/payments/ligdicash/callback
 * @access  Public (mais sécurisé par signature)
 */
exports.handleCallback = async (req, res) => {
  try {
    console.log('📥 Callback LigdiCash reçu:', req.body);

    const signature = req.headers['x-ligdicash-signature'];
    const payload = req.body;

    // Vérifier la signature (en production)
    if (process.env.NODE_ENV === 'production' && !ligdicashService.verifyWebhookSignature(payload, signature)) {
      console.error('❌ Signature invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const { token, status, external_id, custom_data } = payload;

    // Trouver la transaction
    const transaction = await Transaction.findOne({
      where: { 
        ligdicashToken: token 
      }
    });

    if (!transaction) {
      console.error('❌ Transaction non trouvée:', token);
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    // Mettre à jour selon le statut
    if (status === 'completed' || status === 'success') {
      await processSuccessfulPayment(transaction);
    } else if (status === 'failed' || status === 'cancelled') {
      await transaction.update({
        status: 'failed',
        failureReason: payload.message || 'Paiement échoué',
        failedAt: new Date()
      });
    }

    console.log(`✅ Transaction ${transaction.transactionNumber} mise à jour: ${status}`);

    // Répondre à LigdiCash
    return res.status(200).json({ message: 'Callback traité' });

  } catch (error) {
    console.error('❌ Erreur callback:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * @desc    Retour utilisateur après paiement (success page)
 * @route   GET /api/payments/ligdicash/return
 * @access  Public
 */
exports.handleReturn = async (req, res) => {
  try {
    const { token, status } = req.query;

    console.log('🔙 Retour utilisateur:', { token, status });

    if (!token) {
      return res.redirect(`${process.env.APP_URL}/payment/error?message=Token manquant`);
    }

    // Trouver la transaction
    const transaction = await Transaction.findOne({
      where: { ligdicashToken: token }
    });

    if (!transaction) {
      return res.redirect(`${process.env.APP_URL}/payment/error?message=Transaction non trouvée`);
    }

    // Vérifier le statut auprès de LigdiCash
    const paymentStatus = await ligdicashService.checkPaymentStatus(token);

    if (paymentStatus.status === 'completed' || paymentStatus.status === 'success') {
      // Traiter le paiement si pas encore fait
      if (transaction.status === 'pending') {
        await processSuccessfulPayment(transaction);
      }

      return res.redirect(
        `${process.env.APP_URL}/payment/success?transaction=${transaction.transactionNumber}`
      );
    } else {
      return res.redirect(
        `${process.env.APP_URL}/payment/pending?transaction=${transaction.transactionNumber}`
      );
    }

  } catch (error) {
    console.error('❌ Erreur retour:', error);
    return res.redirect(`${process.env.APP_URL}/payment/error?message=${error.message}`);
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

    const transaction = await Transaction.findOne({
      where: {
        transactionNumber,
        userId
      }
    });

    if (!transaction) {
      return ResponseHandler.error(res, 'Transaction non trouvée', 404);
    }

    // Si pending, vérifier auprès de LigdiCash
    if (transaction.status === 'pending' && transaction.ligdicashToken) {
      const paymentStatus = await ligdicashService.checkPaymentStatus(transaction.ligdicashToken);
      
      if (paymentStatus.status === 'completed') {
        await processSuccessfulPayment(transaction);
      }
    }

    return ResponseHandler.success(res, 'Statut récupéré', {
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt
    });

  } catch (error) {
    console.error('❌ Erreur vérification statut:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

/**
 * Traiter un paiement réussi
 */
async function processSuccessfulPayment(transaction) {
  try {
    // Marquer comme complété
    await transaction.update({
      status: 'completed',
      completedAt: new Date()
    });

    const metadata = transaction.metadata || {};

    // ✅ AJOUT: Inclure le montant dans les metadata
    const enrichedMetadata = {
      ...metadata,
      amount: transaction.amount, // ✅ Passer le montant
      price: transaction.amount    // ✅ Alternative pour compatibilité
    };

    // Activer l'abonnement ou l'accès selon le type
    if (transaction.type.includes('subscription')) {
      await activateSubscription(transaction.userId, enrichedMetadata);
    } else if (transaction.type === 'client_access') {
      await activateClientAccess(transaction.userId, enrichedMetadata);
    }

    console.log(`✅ Paiement traité: ${transaction.transactionNumber}`);

  } catch (error) {
    console.error('❌ Erreur traitement paiement:', error);
    throw error;
  }
}

/**
 * Activer un abonnement revendeur
 */
async function activateSubscription(userId, metadata) {
  // Utiliser la logique existante de votre subscriptionController
  const { Subscription, Pricing, User } = require('../models');
  const { Op } = require('sequelize');

  const pricingConfig = await Pricing.findOne({ 
    where: { targetRole: 'revendeur' }
  });

  if (!pricingConfig) return;

  const planType = metadata.planType || 'monthly';
  const planConfig = pricingConfig.plans[planType];

  if (!planConfig) return;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + planConfig.duration);

  await Subscription.create({
    userId,
    planType,
    amount: planConfig.price,
    duration: planConfig.duration,
    startDate,
    endDate,
    paymentMethod: 'ligdicash',
    status: 'active',
    isActive: true
  });

  await User.update(
    {
      subscriptionEndDate: endDate,
      hasActiveSubscription: true,
      hasActiveAccess: true
    },
    { where: { id: userId } }
  );

  console.log(`✅ Abonnement activé pour user ${userId}`);
}

/**
 * Activer un accès client 24h
 */
async function activateClientAccess(userId, metadata) {
  const { AccessPurchase, User, Pricing } = require('../models');

  try {
    const durationHours = metadata.duration || 24;
    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + durationHours);

    // ✅ Récupérer le montant
    let amount = metadata.amount || metadata.price;
    
    if (!amount) {
      const pricingConfig = await Pricing.findOne({ 
        where: { targetRole: 'client' }
      });
      
      if (pricingConfig && pricingConfig.isActive) {
        amount = pricingConfig.price || 0;
      } else {
        amount = 0;
      }
    }

    // ✅ Créer avec le montant
    await AccessPurchase.create({
      userId,
      amount: parseFloat(amount), // ✅ REQUIS
      durationHours,
      purchaseDate,
      expiryDate,
      paymentMethod: 'ligdicash',
      status: 'completed',
      isActive: true
    });

    await User.update(
      {
        hasActiveAccess: true,
        accessExpiryDate: expiryDate
      },
      { where: { id: userId } }
    );

    console.log(`✅ Accès 24h activé pour user ${userId} - Montant: ${amount} FCFA`);

  } catch (error) {
    console.error('❌ Erreur activation accès:', error);
    throw error;
  }
}

module.exports = exports;