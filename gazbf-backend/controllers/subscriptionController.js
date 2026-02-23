// ==========================================
// FICHIER: controllers/subscriptionController.js (VERSION AVEC TRANSACTIONS)
// Gestion des abonnements revendeurs avec création automatique de transactions
// ==========================================

const { Subscription, Pricing, User, Transaction } = require('../models');
const { Op } = require('sequelize');
const transactionController = require('./transactionController');

/**
 * Créer abonnement AVEC transaction
 */
exports.createSubscription = async (req, res) => {
  try {
    const { planType, paymentMethod, transactionId } = req.body;
    const userId = req.user.id;

    console.log('📝 Création abonnement:', { planType, paymentMethod, userId });

    if (!planType || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Plan et méthode de paiement requis'
      });
    }

    // Extraction du type de plan
    let planTypeKey = planType;
    if (planType.includes('_')) {
      planTypeKey = planType.split('_')[0];
    }

    // Vérifier que l'utilisateur est bien revendeur
    if (req.user.role !== 'revendeur') {
      return res.status(403).json({
        success: false,
        message: 'Cette fonctionnalité est réservée aux revendeurs'
      });
    }

    // Récupérer config de tarification
    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'revendeur' }
    });

    if (!pricingConfig || !pricingConfig.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Système d\'abonnement non activé'
      });
    }

    const planConfig = pricingConfig.plans[planTypeKey];
    
    if (!planConfig || !planConfig.enabled || !planConfig.price || planConfig.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce plan n\'est pas disponible actuellement'
      });
    }

    // Vérifier s'il existe déjà un abonnement actif
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        isActive: true,
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà un abonnement actif',
        currentSubscription: {
          planType: existingSubscription.planType,
          endDate: existingSubscription.endDate
        }
      });
    }

    // Calculer les dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planConfig.duration);

    // ✅ CRÉER L'ABONNEMENT
    const subscription = await Subscription.create({
      userId,
      planType: planTypeKey,
      amount: planConfig.price,
      initialAmount: planConfig.price,
      duration: planConfig.duration,
      startDate,
      endDate,
      paymentMethod,
      transactionId: transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      isActive: true,
      autoRenew: pricingConfig.options?.autoRenew || false,
      hasEarlyRenewal: false
    });

    // ✅ CRÉER LA TRANSACTION ASSOCIÉE
    const transaction = await transactionController.createSellerSubscriptionTransaction(
      userId,
      subscription.id,
      planConfig.price,
      paymentMethod,
      {
        planType: planTypeKey,
        duration: planConfig.duration,
        description: `Abonnement ${planTypeKey} - ${planConfig.duration} jours`,
        isRenewal: false,
        isEarlyRenewal: false
      }
    );

    // Mettre à jour l'utilisateur
    await User.update(
      {
        subscriptionEndDate: endDate,
        hasActiveSubscription: true,
        hasActiveAccess: true,
        subscriptionAutoRenew: pricingConfig.options?.autoRenew || false,
        freeTrialEndDate: null,
        gracePeriodEndDate: null
      },
      { where: { id: userId } }
    );

    console.log(`✅ Abonnement créé: ${subscription.id}`);
    console.log(`✅ Transaction créée: ${transaction.transactionNumber}`);

    res.status(201).json({
      success: true,
      message: 'Abonnement créé avec succès !',
      data: {
        subscription: {
          id: subscription.id,
          planType: subscription.planType,
          amount: subscription.amount,
          duration: subscription.duration,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
          isActive: subscription.isActive
        },
        transaction: {
          id: transaction.id,
          transactionNumber: transaction.transactionNumber,
          amount: transaction.amount,
          status: transaction.status
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur création abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'abonnement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Renouvellement anticipé AVEC transaction
 */
exports.earlyRenewal = async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const userId = req.user.id;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de paiement requise'
      });
    }

    const currentSubscription = await Subscription.findOne({
      where: {
        userId,
        isActive: true,
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement actif à renouveler'
      });
    }

    if (currentSubscription.hasEarlyRenewal) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà effectué un renouvellement anticipé pour cet abonnement.'
      });
    }

    // Récupérer la config du plan
    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'revendeur' }
    });

    if (!pricingConfig || !pricingConfig.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Système d\'abonnement non disponible'
      });
    }

    const planConfig = pricingConfig.plans[currentSubscription.planType];

    if (!planConfig || !planConfig.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Ce plan n\'est plus disponible'
      });
    }

    // Sauvegarder l'ancienne date
    const oldEndDate = new Date(currentSubscription.endDate);
    
    // Prolonger la date d'expiration
    const newEndDate = new Date(currentSubscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + planConfig.duration);

    // Calculer le nouveau montant total
    const newTotalAmount = parseFloat(currentSubscription.amount) + parseFloat(planConfig.price);

    // Mettre à jour l'abonnement
    await currentSubscription.update({
      endDate: newEndDate,
      hasEarlyRenewal: true,
      amount: newTotalAmount,
      paymentMethod: paymentMethod
    });

    // ✅ CRÉER LA TRANSACTION DE RENOUVELLEMENT ANTICIPÉ
    const transaction = await transactionController.createSellerSubscriptionTransaction(
      userId,
      currentSubscription.id,
      planConfig.price,
      paymentMethod,
      {
        planType: currentSubscription.planType,
        duration: planConfig.duration,
        description: `Renouvellement anticipé ${currentSubscription.planType}`,
        isRenewal: true,
        isEarlyRenewal: true
      }
    );

    // Mettre à jour l'utilisateur
    await User.update(
      { subscriptionEndDate: newEndDate },
      { where: { id: userId } }
    );

    console.log(`✅ Renouvellement anticipé effectué`);
    console.log(`✅ Transaction créée: ${transaction.transactionNumber}`);

    res.json({
      success: true,
      message: `Abonnement prolongé de ${planConfig.duration} jours jusqu'au ${newEndDate.toLocaleDateString('fr-FR')} !`,
      data: {
        subscription: {
          id: currentSubscription.id,
          planType: currentSubscription.planType,
          oldEndDate,
          newEndDate,
          hasEarlyRenewal: true,
          addedDays: planConfig.duration,
          totalAmount: newTotalAmount
        },
        transaction: {
          id: transaction.id,
          transactionNumber: transaction.transactionNumber,
          amount: transaction.amount,
          status: transaction.status
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur renouvellement anticipé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renouvellement anticipé',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Renouveler (après expiration) AVEC transaction
 */
exports.renewSubscription = async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const userId = req.user.id;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de paiement requise'
      });
    }

    const current = await Subscription.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement à renouveler'
      });
    }

    // Récupérer la config
    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'revendeur' } 
    });
    
    const planConfig = pricingConfig?.plans[current.planType];

    if (!planConfig || !planConfig.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Plan non disponible'
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planConfig.duration);

    // ✅ CRÉER LE NOUVEL ABONNEMENT
    const newSub = await Subscription.create({
      userId,
      planType: current.planType,
      amount: planConfig.price,
      initialAmount: planConfig.price,
      duration: planConfig.duration,
      startDate,
      endDate,
      paymentMethod: paymentMethod,
      transactionId: transactionId || `TXN-RENEW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      isActive: true,
      autoRenew: current.autoRenew,
      hasEarlyRenewal: false
    });

    // ✅ CRÉER LA TRANSACTION DE RENOUVELLEMENT
    const transaction = await transactionController.createSellerSubscriptionTransaction(
      userId,
      newSub.id,
      planConfig.price,
      paymentMethod,
      {
        planType: current.planType,
        duration: planConfig.duration,
        description: `Renouvellement abonnement ${current.planType}`,
        isRenewal: true,
        isEarlyRenewal: false
      }
    );

    await current.update({ 
      isActive: false,
      status: 'expired'
    });

    await User.update(
      {
        subscriptionEndDate: endDate,
        hasActiveSubscription: true,
        hasActiveAccess: true,
        gracePeriodEndDate: null
      },
      { where: { id: userId } }
    );

    console.log(`✅ Abonnement renouvelé`);
    console.log(`✅ Transaction créée: ${transaction.transactionNumber}`);

    res.json({
      success: true,
      message: 'Abonnement renouvelé avec succès !',
      data: {
        subscription: newSub,
        transaction: {
          id: transaction.id,
          transactionNumber: transaction.transactionNumber,
          amount: transaction.amount,
          status: transaction.status
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur renouvellement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur renouvellement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Récupérer mon abonnement
 */
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        userId: req.user.id,
        isActive: true,
        endDate: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'Aucun abonnement actif'
      });
    }

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    console.error('❌ Erreur récupération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération',
      error: error.message
    });
  }
};

/**
 * Suppression immédiate
 */
exports.deleteSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      where: {
        userId,
        isActive: true,
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement actif à supprimer'
      });
    }

    // Supprimer immédiatement
    const now = new Date();
    await subscription.update({
      isActive: false,
      status: 'deleted',
      endDate: now
    });

    await User.update(
      {
        subscriptionEndDate: now,
        hasActiveSubscription: false,
        hasActiveAccess: false,
        subscriptionAutoRenew: false,
        gracePeriodEndDate: null
      },
      { where: { id: userId } }
    );

    console.log('✅ Abonnement supprimé immédiatement');

    res.json({
      success: true,
      message: 'Abonnement supprimé immédiatement. Votre dépôt n\'est plus visible.',
      data: {
        deletedAt: now,
        planType: subscription.planType,
        id: subscription.id
      }
    });

  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Plans disponibles
 */
exports.getPlans = async (req, res) => {
  try {
    const userRole = req.user.role === 'revendeur' ? 'revendeur' : 'client';
    const pricingConfig = await Pricing.findOne({ where: { targetRole: userRole } });

    if (!pricingConfig?.isActive) {
      return res.json({
        success: true,
        data: {
          isActive: false,
          message: 'Accès gratuit illimité',
          plans: []
        }
      });
    }

    const activePlans = {};
    Object.entries(pricingConfig.plans).forEach(([key, plan]) => {
      if (plan.enabled && plan.price > 0) {
        activePlans[key] = {
          ...plan,
          id: `${key}_${userRole}`
        };
      }
    });

    res.json({
      success: true,
      data: {
        isActive: true,
        freeTrialDays: pricingConfig.freeTrialDays,
        plans: activePlans,
        options: pricingConfig.options
      }
    });

  } catch (error) {
    console.error('❌ Erreur plans:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération plans',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;