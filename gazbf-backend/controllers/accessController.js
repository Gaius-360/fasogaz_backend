// ==========================================
// FICHIER: controllers/accessController.js (VERSION AVEC TRANSACTIONS)
// Contrôleur pour gérer les achats d'accès 24h avec création automatique de transactions
// ==========================================

const { User, AccessPurchase, Pricing } = require('../models');
const { Op } = require('sequelize');
const transactionController = require('./transactionController');

/**
 * @desc    Acheter un accès 24h AVEC transaction
 * @route   POST /api/access/purchase
 * @access  Private (Client)
 */
exports.purchaseAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, transactionId } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de paiement requise'
      });
    }

    // Récupérer la config de tarification
    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'client' } 
    });

    // Si système désactivé
    if (!pricingConfig || !pricingConfig.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Le système de paiement n\'est pas activé. Accès gratuit pour tous.'
      });
    }

    const price = parseFloat(pricingConfig.accessPrice24h);
    const duration = pricingConfig.accessDurationHours || 24;

    // Vérifier les limites si configurées
    if (pricingConfig.options?.maxPurchasesPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const purchasesToday = await AccessPurchase.count({
        where: {
          userId,
          purchaseDate: {
            [Op.gte]: today
          }
        }
      });

      if (purchasesToday >= pricingConfig.options.maxPurchasesPerDay) {
        return res.status(429).json({
          success: false,
          message: `Limite de ${pricingConfig.options.maxPurchasesPerDay} achats par jour atteinte`
        });
      }
    }

    // Dates
    const now = new Date();
    const expiryDate = new Date(now.getTime() + duration * 60 * 60 * 1000);

    // ✅ CRÉER L'ACHAT D'ACCÈS
    const accessPurchase = await AccessPurchase.create({
      userId,
      amount: price,
      durationHours: duration,
      purchaseDate: now,
      expiryDate,
      paymentMethod,
      transactionId: transactionId || null,
      status: 'completed',
      isActive: true,
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceInfo: req.headers['user-agent']
    });

    // ✅ CRÉER LA TRANSACTION ASSOCIÉE
    const transaction = await transactionController.createClientAccessTransaction(
      userId,
      accessPurchase.id,
      price,
      paymentMethod,
      {
        duration,
        description: `Accès 24h - ${duration}h`,
        purchaseDate: now,
        expiryDate
      }
    );

    // Activer l'accès pour l'utilisateur
    const user = await User.findByPk(userId);
    await user.update({
      lastAccessPurchaseDate: now,
      accessExpiryDate: expiryDate,
      hasActiveAccess: true,
      totalAccessPurchases: (user.totalAccessPurchases || 0) + 1
    });

    console.log(`✅ Accès client créé: ${accessPurchase.id}`);
    console.log(`✅ Transaction créée: ${transaction.transactionNumber}`);

    res.status(201).json({
      success: true,
      message: `Accès 24h activé avec succès ! Valable jusqu'au ${expiryDate.toLocaleString('fr-FR')}`,
      data: {
        purchase: {
          id: accessPurchase.id,
          durationHours: duration,
          purchaseDate: now,
          expiryDate,
          amount: price
        },
        transaction: {
          id: transaction.id,
          transactionNumber: transaction.transactionNumber,
          amount: transaction.amount,
          status: transaction.status
        },
        access: {
          activatedAt: now,
          expiresAt: expiryDate,
          durationHours: duration,
          price: price
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur achat accès:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'achat',
      error: error.message
    });
  }
};

/**
 * @desc    Vérifier le statut d'accès de l'utilisateur
 * @route   GET /api/access/status
 * @access  Private (Client)
 */
exports.checkAccessStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifier si le système est actif
    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'client' } 
    });

    // Si système désactivé, accès gratuit pour tous
    if (!pricingConfig || !pricingConfig.isActive) {
      return res.json({
        success: true,
        data: {
          hasAccess: true,
          accessType: 'free',
          message: 'Accès gratuit illimité',
          expiresAt: null,
          remainingHours: null
        }
      });
    }

    // Vérifier l'accès actif de l'utilisateur
    const user = await User.findByPk(userId);

    if (!user.hasActiveAccess || !user.accessExpiryDate) {
      return res.json({
        success: true,
        data: {
          hasAccess: false,
          accessType: 'none',
          message: 'Aucun accès actif',
          price: parseFloat(pricingConfig.accessPrice24h),
          duration: pricingConfig.accessDurationHours,
          totalPurchases: user.totalAccessPurchases || 0
        }
      });
    }

    // Vérifier si l'accès a expiré
    const now = new Date();
    const expiryDate = new Date(user.accessExpiryDate);

    if (now >= expiryDate) {
      // Accès expiré, mettre à jour
      await user.update({
        hasActiveAccess: false
      });

      return res.json({
        success: true,
        data: {
          hasAccess: false,
          accessType: 'expired',
          message: 'Votre accès a expiré',
          expiredAt: expiryDate,
          price: parseFloat(pricingConfig.accessPrice24h),
          duration: pricingConfig.accessDurationHours,
          totalPurchases: user.totalAccessPurchases || 0
        }
      });
    }

    // Calculer le temps restant
    const remainingMs = expiryDate - now;
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return res.json({
      success: true,
      data: {
        hasAccess: true,
        accessType: 'active',
        message: 'Accès actif',
        purchasedAt: user.lastAccessPurchaseDate,
        expiresAt: expiryDate,
        remainingHours,
        remainingMinutes,
        remainingTime: `${remainingHours}h ${remainingMinutes}min`,
        totalPurchases: user.totalAccessPurchases || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur vérification accès:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir la configuration de tarification client
 * @route   GET /api/access/pricing
 * @access  Public
 */
exports.getPricing = async (req, res) => {
  try {
    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'client' } 
    });

    if (!pricingConfig) {
      return res.json({
        success: true,
        data: {
          isActive: false,
          price: 0,
          duration: 24,
          message: 'Accès gratuit illimité'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        isActive: pricingConfig.isActive,
        price: parseFloat(pricingConfig.accessPrice24h),
        duration: pricingConfig.accessDurationHours,
        options: pricingConfig.options || {},
        message: pricingConfig.isActive 
          ? `Accès 24h à ${pricingConfig.accessPrice24h} FCFA`
          : 'Accès gratuit illimité'
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération tarifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir l'historique des achats
 * @route   GET /api/access/history
 * @access  Private (Client)
 */
exports.getAccessHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: purchases } = await AccessPurchase.findAndCountAll({
      where: { userId },
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
    console.error('❌ Erreur historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir les statistiques d'accès
 * @route   GET /api/access/stats
 * @access  Private (Client)
 */
exports.getAccessStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalPurchases = await AccessPurchase.count({
      where: { userId }
    });

    const totalSpent = await AccessPurchase.sum('amount', {
      where: { 
        userId,
        status: 'completed'
      }
    });

    const lastPurchase = await AccessPurchase.findOne({
      where: { userId },
      order: [['purchaseDate', 'DESC']]
    });

    // Achats des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPurchases = await AccessPurchase.count({
      where: {
        userId,
        purchaseDate: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalPurchases,
        totalSpent: parseFloat(totalSpent || 0),
        recentPurchases,
        lastPurchase: lastPurchase ? {
          date: lastPurchase.purchaseDate,
          amount: parseFloat(lastPurchase.amount),
          expiryDate: lastPurchase.expiryDate
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

module.exports = exports;