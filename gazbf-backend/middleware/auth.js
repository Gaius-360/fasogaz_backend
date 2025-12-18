// ==========================================
// FICHIER: middleware/auth.js
// ==========================================
const jwt = require('jsonwebtoken');
const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Vérifier si le token existe
  if (!token) {
    return ResponseHandler.error(
      res,
      'Non autorisé. Token manquant.',
      401
    );
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Subscription,
          as: 'subscription'
        }
      ]
    });

    if (!user) {
      return ResponseHandler.error(
        res,
        'Utilisateur non trouvé',
        404
      );
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return ResponseHandler.error(
        res,
        'Compte désactivé. Contactez le support.',
        403
      );
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    return ResponseHandler.error(
      res,
      'Token invalide ou expiré',
      401
    );
  }
};

// Middleware pour vérifier les rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ResponseHandler.error(
        res,
        `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`,
        403
      );
    }
    next();
  };
};

// Middleware pour vérifier l'abonnement actif
exports.checkSubscription = async (req, res, next) => {
  try {
    const subscription = req.user.subscription;

    if (!subscription) {
      return ResponseHandler.error(
        res,
        'Aucun abonnement trouvé. Veuillez vous abonner pour continuer.',
        403
      );
    }

    // Vérifier si l'abonnement est actif
    if (!subscription.isActive) {
      return ResponseHandler.error(
        res,
        'Votre abonnement est inactif.',
        403
      );
    }

    // Vérifier si l'abonnement n'est pas expiré
    const now = new Date();
    if (new Date(subscription.endDate) < now) {
      // Désactiver l'abonnement
      await subscription.update({ isActive: false });
      
      return ResponseHandler.error(
        res,
        `Votre abonnement a expiré le ${new Date(subscription.endDate).toLocaleDateString('fr-FR')}. Veuillez renouveler votre abonnement.`,
        403
      );
    }

    next();
  } catch (error) {
    return ResponseHandler.error(
      res,
      'Erreur lors de la vérification de l\'abonnement',
      500
    );
  }
};

// Middleware pour vérifier la validation du profil (revendeurs)
exports.checkSellerValidation = async (req, res, next) => {
  try {
    if (req.user.role !== 'revendeur') {
      return next();
    }

    if (req.user.validationStatus === 'pending') {
      return ResponseHandler.error(
        res,
        'Votre profil est en cours de validation. Vous recevrez une notification dans les 24-48h.',
        403
      );
    }

    if (req.user.validationStatus === 'rejected') {
      return ResponseHandler.error(
        res,
        `Votre profil a été rejeté. Raison: ${req.user.rejectionReason || 'Non spécifiée'}. Veuillez corriger et soumettre à nouveau.`,
        403
      );
    }

    next();
  } catch (error) {
    return ResponseHandler.error(
      res,
      'Erreur lors de la vérification du statut de validation',
      500
    );
  }
};



exports.checkSellerApproved = async (req, res, next) => {
  try {
    if (req.user.role !== 'revendeur') {
      return next();
    }

    if (req.user.validationStatus !== 'approved') {
      return ResponseHandler.error(
        res,
        'Votre compte doit être approuvé pour effectuer cette action',
        403
      );
    }

    next();
  } catch (error) {
    return ResponseHandler.error(
      res,
      'Erreur lors de la vérification du statut',
      500
    );
  }
};