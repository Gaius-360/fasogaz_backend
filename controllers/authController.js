// ==========================================
// FICHIER: controllers/authController.js
// ✅ VERSION FINALE
//    - OTP jamais retourné dans les réponses API
//    - Messages génériques anti-énumération
//    - Validation GPS clients conservée
//    - FIX: 'preparing' retiré de l'enum orders_status
//    - PERSISTANCE: refreshToken retourné dans le JSON (pas de cookie)
//      → fiable en cross-domain (fasogaz.onrender.com / fasogaz-backend.onrender.com)
//      → le client le stocke en localStorage et l'envoie dans le body
// ✅ CORRECTION BUG PWA: accessToken passé de 15m à 1h
//    → laisse une fenêtre suffisante pour le refresh sur réseau dégradé
//      (mobile 2G, Render free-tier cold start ~30s)
//    → combiné avec le refresh proactif sur visibilitychange côté client,
//      l'utilisateur ne voit jamais de déconnexion intempestive
// ==========================================

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const sendSMS         = require('../utils/sendSMS');
const generateOTP     = require('../utils/generateOTP');
const { validateLocationForCity } = require('../utils/locationValidator');

const ACTIVE_ORDER_STATUSES = ['pending', 'accepted', 'in_delivery'];

// ==========================================
// HELPERS TOKENS
// ==========================================

/** Refresh token JWT — 90 jours — signé avec JWT_REFRESH_SECRET */
const generateRefreshToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '90d' }
  );

/**
 * Access token JWT — 1h — signé avec JWT_SECRET
 *
 * ✅ Passé de 15m à 1h pour la robustesse PWA mobile :
 * - Sur réseau dégradé (2G, Render cold start), un refresh peut prendre
 *   jusqu'à 30-40s. Avec 15m, la moindre suspension de l'app en
 *   arrière-plan suffit à expirer le token avant que le refresh proactif
 *   n'ait le temps de s'exécuter.
 * - 1h donne une fenêtre confortable. Le refresh silencieux sur
 *   visibilitychange (côté App.jsx) renouvelle le token à chaque retour
 *   au premier plan, donc en pratique l'utilisateur ne voit jamais
 *   de délai.
 * - Sécurité : le refreshToken (90j) reste le vrai facteur limitant.
 *   Si un accessToken est volé, la fenêtre d'exposition passe de 15m
 *   à 1h — risque acceptable pour une app mobile grand public.
 */
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

// ==========================================
// INSCRIPTION
// @route   POST /api/auth/register
// @access  Public
// ==========================================
exports.register = async (req, res) => {
  try {
    const {
      phone, password, firstName, lastName, role,
      city, quarter, businessName, businessAddress,
      token, latitude, longitude, locationVerified
    } = req.body;

    if (!phone || !password || !firstName || !lastName || !role) {
      return ResponseHandler.error(res, 'Tous les champs sont requis', 400);
    }

    const existingUser = await db.User.findOne({ where: { phone } });
    if (existingUser) {
      return ResponseHandler.error(res, 'Ce numéro est déjà enregistré', 400);
    }

    // Validation GPS pour les clients uniquement
    if (role === 'client') {
      if (!locationVerified || latitude === undefined || longitude === undefined) {
        return ResponseHandler.error(res, 'La vérification de votre position GPS est requise.', 400);
      }
      if (!city) {
        return ResponseHandler.error(res, 'La ville est requise', 400);
      }
      const locationCheck = validateLocationForCity(latitude, longitude, city);
      if (!locationCheck.valid) {
        return ResponseHandler.error(res, locationCheck.message, 403);
      }
    }

    const userData = {
      phone, password, firstName, lastName, role,
      city, quarter, isVerified: true, isActive: true
    };

    if (role === 'revendeur') {
      userData.businessName     = businessName || null;
      userData.businessAddress  = businessAddress || null;
      userData.validationStatus = 'approved';

      if (token) {
        const invitation = await db.InvitationToken.findOne({
          where: { token },
          include: [{ model: db.User, as: 'generator', attributes: ['id', 'firstName', 'lastName', 'role'] }]
        });

        if (!invitation)
          return ResponseHandler.error(res, 'Token d\'invitation invalide', 404);
        if (invitation.status === 'used')
          return ResponseHandler.error(res, 'Ce lien a déjà été utilisé', 400);
        if (invitation.status === 'revoked')
          return ResponseHandler.error(res, 'Ce lien a été révoqué', 400);
        if (new Date() > new Date(invitation.expiresAt)) {
          await invitation.update({ status: 'expired' });
          return ResponseHandler.error(res, 'Ce lien a expiré', 400);
        }

        userData.metadata = {
          invitedBy:    invitation.generatedBy,
          inviterType:  invitation.generatorType,
          invitationId: invitation.id,
          registeredAt: new Date()
        };
      }

      const pricingConfig = await db.Pricing.findOne({ where: { targetRole: 'revendeur' } });
      if (pricingConfig?.isActive && pricingConfig.freeTrialDays > 0) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + pricingConfig.freeTrialDays);
        userData.freeTrialEndDate = trialEnd;
      }
    }

    const user = await db.User.create(userData);

    // Marquer le token d'invitation utilisé
    if (role === 'revendeur' && token) {
      const invitation = await db.InvitationToken.findOne({ where: { token } });
      if (invitation) {
        await invitation.update({
          status: 'used', usedBy: user.id,
          usedByPhone: user.phone, usedAt: new Date()
        });
        if (invitation.generatorType === 'agent') {
          const agent = await db.User.findByPk(invitation.generatedBy);
          if (agent) {
            const stats = agent.agentStats || {};
            stats.totalSellersRecruited = (stats.totalSellersRecruited || 0) + 1;
            await agent.update({ agentStats: stats });
          }
        }
      }
    }

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // ✅ Les deux tokens retournés dans le JSON — pas de cookie
    return ResponseHandler.success(
      res, 'Inscription réussie. Bienvenue !',
      {
        token:        accessToken,
        refreshToken: refreshToken,
        user: {
          id:               user.id,
          phone:            user.phone,
          firstName:        user.firstName,
          lastName:         user.lastName,
          role:             user.role,
          city:             user.city,
          businessName:     user.businessName || null,
          isVerified:       true,
          validationStatus: user.validationStatus || null
        }
      },
      201
    );
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    return ResponseHandler.error(res, error.message || 'Erreur lors de l\'inscription', 500);
  }
};

// ==========================================
// CONNEXION
// @route   POST /api/auth/login
// @access  Public
// ==========================================
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return ResponseHandler.error(res, 'Téléphone et mot de passe requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (!user || !(await user.comparePassword(password))) {
      return ResponseHandler.error(res, 'Identifiants incorrects', 401);
    }

    if (!user.isVerified) {
      return ResponseHandler.error(res, 'Compte non vérifié. Contactez le support.', 403);
    }

    if (!user.isActive) {
      return ResponseHandler.error(res, 'Compte désactivé. Contactez le support.', 403);
    }

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // OTP et otpExpiry toujours exclus de la réponse
    const userResponse = await db.User.findByPk(user.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    // ✅ Les deux tokens retournés dans le JSON — pas de cookie
    return ResponseHandler.success(res, 'Connexion réussie', {
      token:        accessToken,
      refreshToken: refreshToken,
      user:         userResponse
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    return ResponseHandler.error(res, 'Erreur lors de la connexion', 500);
  }
};

// ==========================================
// REFRESH TOKEN
// @route   POST /api/auth/refresh
// @access  Public
// ✅ Reçoit le refresh token dans req.body.refreshToken
//    (plus de cookie — fonctionne en cross-domain sans configuration CORS spéciale)
// ==========================================
exports.refreshToken = async (req, res) => {
  try {
    const token = req.body?.refreshToken;

    if (!token) {
      return ResponseHandler.error(res, 'Refresh token manquant', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      return ResponseHandler.error(res, 'Session expirée, veuillez vous reconnecter', 401);
    }

    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 401);
    }

    if (!user.isActive) {
      return ResponseHandler.error(res, 'Compte désactivé. Contactez le support.', 403);
    }

    // Nouveaux tokens — rotation du refresh token
    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user.id);

    console.log(`✅ Token rafraîchi pour l'utilisateur ${user.id} (${user.role})`);

    // ✅ Les deux tokens retournés dans le JSON
    return ResponseHandler.success(res, 'Token renouvelé', {
      token:        newAccessToken,
      refreshToken: newRefreshToken,
      user,
    });

  } catch (error) {
    console.error('❌ Erreur refresh token:', error);
    return ResponseHandler.error(res, 'Erreur lors du renouvellement', 500);
  }
};

// ==========================================
// DÉCONNEXION
// @route   POST /api/auth/logout
// @access  Public
// ==========================================
exports.logout = (req, res) => {
  // Pas de cookie à effacer — le client supprime ses tokens du localStorage
  return ResponseHandler.success(res, 'Déconnexion réussie');
};

// ==========================================
// VÉRIFICATION OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ==========================================
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return ResponseHandler.error(res, 'Téléphone et code OTP requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    // Message générique — ne pas distinguer "compte inexistant" de "OTP incorrect"
    if (!user || user.otp !== otp || new Date() > user.otpExpiry) {
      return ResponseHandler.error(res, 'Code OTP invalide ou expiré', 400);
    }

    await user.update({ otp: null, otpExpiry: null });

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    return ResponseHandler.success(res, 'Code vérifié avec succès', {
      token:        accessToken,
      refreshToken: refreshToken,
      user: {
        id:               user.id,
        phone:            user.phone,
        firstName:        user.firstName,
        lastName:         user.lastName,
        role:             user.role,
        city:             user.city,
        businessName:     user.businessName,
        isVerified:       user.isVerified,
        validationStatus: user.validationStatus
      }
    });

  } catch (error) {
    console.error('❌ Erreur vérification OTP:', error);
    return ResponseHandler.error(res, 'Erreur lors de la vérification', 500);
  }
};

// ==========================================
// RENVOYER L'OTP
// @route   POST /api/auth/resend-otp
// @access  Public
// ==========================================
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return ResponseHandler.error(res, 'Numéro de téléphone requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (user) {
      const otp       = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.update({ otp, otpExpiry });

      try {
        await sendSMS(phone, `Votre code de vérification FasoGaz : ${otp}. Valable 10 minutes.`);
      } catch (smsError) {
        console.error('❌ Erreur envoi SMS:', smsError);
      }
    }

    // Réponse identique que l'utilisateur existe ou non
    return ResponseHandler.success(
      res, 'Si ce numéro est enregistré, un code vous a été envoyé par SMS.'
    );

  } catch (error) {
    console.error('❌ Erreur renvoi OTP:', error);
    return ResponseHandler.error(res, 'Erreur lors du renvoi', 500);
  }
};

// ==========================================
// MOT DE PASSE OUBLIÉ
// @route   POST /api/auth/forgot-password
// @access  Public
// ==========================================
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return ResponseHandler.error(res, 'Numéro de téléphone requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (user) {
      const otp       = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.update({ otp, otpExpiry });

      try {
        await sendSMS(
          phone,
          `Code de réinitialisation FasoGaz : ${otp}. Valable 10 min. Ne le partagez jamais.`
        );
      } catch (smsError) {
        console.error('❌ Erreur SMS forgot-password:', smsError);
      }
    }

    // Réponse générique — ne confirme pas l'existence du compte
    return ResponseHandler.success(
      res, 'Si ce numéro est enregistré, un code de réinitialisation vous a été envoyé par SMS.'
    );

  } catch (error) {
    console.error('❌ Erreur forgot password:', error);
    return ResponseHandler.error(res, 'Erreur lors de la demande', 500);
  }
};

// ==========================================
// RÉINITIALISER LE MOT DE PASSE
// @route   POST /api/auth/reset-password
// @access  Public
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return ResponseHandler.error(res, 'Téléphone, OTP et nouveau mot de passe requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (!user || user.otp !== otp || new Date() > user.otpExpiry) {
      return ResponseHandler.error(res, 'Code OTP invalide ou expiré', 400);
    }

    await user.update({ password: newPassword, otp: null, otpExpiry: null });

    return ResponseHandler.success(res, 'Mot de passe réinitialisé avec succès');

  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    return ResponseHandler.error(res, 'Erreur lors de la réinitialisation', 500);
  }
};

// ==========================================
// MON PROFIL
// @route   GET /api/auth/me
// @access  Private
// ==========================================
exports.getMe = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    if (!user) return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);

    return ResponseHandler.success(res, 'Profil récupéré', { user });
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    return ResponseHandler.error(res, 'Erreur serveur', 500);
  }
};

// ==========================================
// MISE À JOUR DU PROFIL
// @route   PUT /api/auth/update-profile
// @access  Private
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName, lastName, email, businessName, businessDescription,
      quarter, latitude, longitude, businessPhoto, openingHours,
      deliveryAvailable, deliveryRadius, deliveryFee
    } = req.body;

    const user = await db.User.findByPk(userId);
    if (!user) return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName  !== undefined) updates.lastName  = lastName;
    if (email     !== undefined) updates.email = email.trim() === '' ? null : email.trim();

    if (user.role === 'revendeur') {
      if (businessName        !== undefined) updates.businessName        = businessName;
      if (businessDescription !== undefined) updates.businessDescription = businessDescription;
      if (quarter             !== undefined) updates.quarter             = quarter;

      if (latitude !== undefined && latitude !== null) {
        const lat = parseFloat(latitude);
        if (isNaN(lat) || lat < -90  || lat > 90)
          return ResponseHandler.error(res, 'Latitude invalide', 400);
        updates.latitude = lat;
      }
      if (longitude !== undefined && longitude !== null) {
        const lon = parseFloat(longitude);
        if (isNaN(lon) || lon < -180 || lon > 180)
          return ResponseHandler.error(res, 'Longitude invalide', 400);
        updates.longitude = lon;
      }

      if (businessPhoto !== undefined) updates.businessPhoto = businessPhoto;
      if (openingHours  !== undefined) updates.openingHours  = openingHours;

      if (user.validationStatus === 'approved') {
        if (deliveryAvailable !== undefined) updates.deliveryAvailable = deliveryAvailable;
        if (deliveryRadius    !== undefined) updates.deliveryRadius    = deliveryRadius;
        if (deliveryFee       !== undefined) updates.deliveryFee       = deliveryFee;
      }
    }

    await user.update(updates);

    const updatedUser = await db.User.findByPk(userId, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    return ResponseHandler.success(res, 'Profil mis à jour avec succès', { user: updatedUser });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour du profil', 500);
  }
};

// ==========================================
// CHANGER LE MOT DE PASSE
// @route   PUT /api/auth/change-password
// @access  Private
// ==========================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ResponseHandler.error(res, 'Mot de passe actuel et nouveau requis', 400);
    }

    const user    = await db.User.findByPk(req.user.id);
    const isValid = await user.comparePassword(currentPassword);

    if (!isValid) {
      return ResponseHandler.error(res, 'Mot de passe actuel incorrect', 400);
    }

    await user.update({ password: newPassword });

    return ResponseHandler.success(res, 'Mot de passe modifié avec succès');

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    return ResponseHandler.error(res, 'Erreur lors du changement de mot de passe', 500);
  }
};

// ==========================================
// PARAMÈTRES DE LIVRAISON
// @route   PUT /api/auth/update-delivery
// @access  Private (Revendeurs)
// ==========================================
exports.updateDeliverySettings = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user)
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    if (user.role !== 'revendeur')
      return ResponseHandler.error(res, 'Réservé aux revendeurs', 403);
    if (user.validationStatus !== 'approved')
      return ResponseHandler.error(res, 'Compte non approuvé', 403);

    const { deliveryAvailable, deliveryRadius, deliveryFee } = req.body;
    const updates = {};
    if (deliveryAvailable !== undefined) updates.deliveryAvailable = deliveryAvailable;
    if (deliveryRadius    !== undefined) updates.deliveryRadius    = deliveryRadius;
    if (deliveryFee       !== undefined) updates.deliveryFee       = deliveryFee;

    await user.update(updates);

    const updatedUser = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    return ResponseHandler.success(res, 'Paramètres de livraison mis à jour', { user: updatedUser });

  } catch (error) {
    console.error('❌ Erreur mise à jour livraison:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// ==========================================
// SUPPRIMER LE COMPTE
// @route   DELETE /api/auth/delete-account
// @access  Private
// ==========================================
exports.deleteAccount = async (req, res) => {
  let transaction;
  try {
    const { password } = req.body;
    if (!password) return ResponseHandler.error(res, 'Le mot de passe est requis', 400);

    transaction = await db.sequelize.transaction();
    const user  = await db.User.findByPk(req.user.id);

    if (!user) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    if (!(await user.comparePassword(password))) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Mot de passe incorrect', 401);
    }

    if (user.role === 'revendeur') {
      const pendingCount = await db.Order.count({
        where: { sellerId: user.id, status: ACTIVE_ORDER_STATUSES }
      });
      if (pendingCount > 0) {
        await transaction.rollback();
        return ResponseHandler.error(res, `Impossible : ${pendingCount} commande(s) en cours.`, 400);
      }
      await db.Product.destroy({ where: { sellerId: user.id }, transaction });
    }

    if (user.role === 'client') {
      const pendingCount = await db.Order.count({
        where: { customerId: user.id, status: ACTIVE_ORDER_STATUSES }
      });
      if (pendingCount > 0) {
        await transaction.rollback();
        return ResponseHandler.error(res, `Impossible : ${pendingCount} commande(s) en cours.`, 400);
      }
    }

    await db.Address.destroy({ where: { userId: user.id }, transaction });
    await db.Review.destroy({ where: { customerId: user.id }, transaction });
    await db.Notification.destroy({ where: { userId: user.id }, transaction });
    await user.destroy({ transaction });
    await transaction.commit();

    return ResponseHandler.success(res, 'Votre compte a été supprimé avec succès');

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Erreur suppression compte:', error.message, error.stack);
    return ResponseHandler.error(res, error.message || 'Erreur lors de la suppression du compte', 500);
  }
};

// ==========================================
// DEMANDER LA SUPPRESSION DU COMPTE (différée 30j)
// @route   POST /api/auth/request-account-deletion
// @access  Private
// ==========================================
exports.requestAccountDeletion = async (req, res) => {
  try {
    const { password, reason } = req.body;
    if (!password) return ResponseHandler.error(res, 'Le mot de passe est requis', 400);

    const user = await db.User.findByPk(req.user.id);
    if (!user) return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);

    if (!(await user.comparePassword(password))) {
      return ResponseHandler.error(res, 'Mot de passe incorrect', 401);
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await user.update({
      isActive:              false,
      deletionRequestedAt:   new Date(),
      scheduledDeletionDate: deletionDate,
      deletionReason:        reason || null
    });

    return ResponseHandler.success(
      res, `Votre compte sera supprimé le ${deletionDate.toLocaleDateString('fr-FR')}`
    );
  } catch (error) {
    console.error('❌ Erreur demande suppression:', error);
    return ResponseHandler.error(res, 'Erreur lors de la demande de suppression', 500);
  }
};

// ==========================================
// ANNULER LA SUPPRESSION DU COMPTE
// @route   POST /api/auth/cancel-account-deletion
// @access  Private
// ==========================================
exports.cancelAccountDeletion = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    if (!user.deletionRequestedAt) return ResponseHandler.error(res, 'Aucune demande en cours', 400);

    await user.update({
      isActive:              true,
      deletionRequestedAt:   null,
      scheduledDeletionDate: null,
      deletionReason:        null
    });

    return ResponseHandler.success(res, 'La suppression a été annulée avec succès');
  } catch (error) {
    console.error('❌ Erreur annulation suppression:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'annulation', 500);
  }
};