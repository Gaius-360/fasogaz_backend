// ==========================================
// FICHIER: middleware/checkAccess.js
// Middleware pour vérifier l'accès client avant actions sensibles
// ==========================================

const { User, Pricing } = require('../models');

/**
 * Middleware pour vérifier si le client a un accès actif
 * Utiliser ce middleware sur les routes qui nécessitent un accès payant
 */
const checkClientAccess = async (req, res, next) => {
  try {
    // Si l'utilisateur n'est pas un client, laisser passer
    if (!req.user || req.user.role !== 'client') {
      return next();
    }

    // Vérifier si le système de tarification est actif
    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'client' } 
    });

    // Si système désactivé, accès gratuit pour tous
    if (!pricingConfig || !pricingConfig.isActive) {
      req.accessInfo = {
        hasAccess: true,
        accessType: 'free',
        requiresPurchase: false
      };
      return next();
    }

    // Récupérer l'utilisateur avec ses infos d'accès
    const user = await User.findByPk(req.user.id);

    // Vérifier si l'utilisateur a un accès actif
    if (!user.hasActiveAccess || !user.accessExpiryDate) {
      req.accessInfo = {
        hasAccess: false,
        accessType: 'none',
        requiresPurchase: true,
        price: parseFloat(pricingConfig.accessPrice24h),
        duration: pricingConfig.accessDurationHours
      };
      
      return res.status(403).json({
        success: false,
        requiresAccess: true,
        message: 'Vous devez acheter un accès 24h pour voir ces informations',
        accessInfo: {
          price: parseFloat(pricingConfig.accessPrice24h),
          duration: pricingConfig.accessDurationHours,
          message: `Accès 24h disponible à ${pricingConfig.accessPrice24h} FCFA`
        }
      });
    }

    // Vérifier si l'accès n'a pas expiré
    const now = new Date();
    const expiryDate = new Date(user.accessExpiryDate);

    if (now >= expiryDate) {
      // Mettre à jour le statut
      await user.update({ hasActiveAccess: false });

      req.accessInfo = {
        hasAccess: false,
        accessType: 'expired',
        requiresPurchase: true,
        expiredAt: expiryDate,
        price: parseFloat(pricingConfig.accessPrice24h),
        duration: pricingConfig.accessDurationHours
      };

      return res.status(403).json({
        success: false,
        requiresAccess: true,
        message: 'Votre accès a expiré. Veuillez renouveler pour continuer.',
        accessInfo: {
          expiredAt: expiryDate,
          price: parseFloat(pricingConfig.accessPrice24h),
          duration: pricingConfig.accessDurationHours,
          message: `Renouvelez votre accès pour ${pricingConfig.accessPrice24h} FCFA`
        }
      });
    }

    // Calculer le temps restant
    const remainingMs = expiryDate - now;
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    // L'utilisateur a un accès actif
    req.accessInfo = {
      hasAccess: true,
      accessType: 'active',
      requiresPurchase: false,
      expiresAt: expiryDate,
      remainingHours,
      remainingMinutes,
      remainingTime: `${remainingHours}h ${remainingMinutes}min`
    };

    next();

  } catch (error) {
    console.error('❌ Erreur vérification accès:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification d\'accès',
      error: error.message
    });
  }
};

/**
 * Middleware optionnel qui ajoute les infos d'accès sans bloquer
 * Utile pour les routes qui veulent afficher des infos partielles
 */
const attachAccessInfo = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      req.accessInfo = { hasAccess: true, accessType: 'unrestricted' };
      return next();
    }

    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'client' } 
    });

    if (!pricingConfig || !pricingConfig.isActive) {
      req.accessInfo = { hasAccess: true, accessType: 'free' };
      return next();
    }

    const user = await User.findByPk(req.user.id);
    const now = new Date();
    
    if (user.hasActiveAccess && user.accessExpiryDate && now < new Date(user.accessExpiryDate)) {
      const remainingMs = new Date(user.accessExpiryDate) - now;
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      
      req.accessInfo = {
        hasAccess: true,
        accessType: 'active',
        expiresAt: user.accessExpiryDate,
        remainingHours,
        remainingMinutes
      };
    } else {
      req.accessInfo = {
        hasAccess: false,
        accessType: user.accessExpiryDate ? 'expired' : 'none',
        price: parseFloat(pricingConfig.accessPrice24h),
        duration: pricingConfig.accessDurationHours
      };
    }

    next();

  } catch (error) {
    console.error('❌ Erreur attachement info accès:', error);
    req.accessInfo = { hasAccess: false, error: true };
    next();
  }
};

module.exports = {
  checkClientAccess,
  attachAccessInfo
};