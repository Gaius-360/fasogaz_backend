// ==========================================
// FICHIER: controllers/authController.js
// ✅ VERSION SANS OTP À L'INSCRIPTION - Connexion directe après register
// ==========================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const sendSMS = require('../utils/sendSMS');
const generateOTP = require('../utils/generateOTP');
const { initFreeTrialIfNeeded } = require('../middleware/subscriptionMiddleware');

// @desc    Inscription
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      phone,
      password,
      firstName,
      lastName,
      role,
      city,
      quarter,
      businessName,
      businessAddress,
      token // ✅ Token d'invitation pour revendeur
    } = req.body;

    console.log('📝 Inscription demandée:', { phone, role, hasToken: !!token });

    // Validation
    if (!phone || !password || !firstName || !lastName || !role) {
      return ResponseHandler.error(res, 'Tous les champs sont requis', 400);
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await db.User.findOne({ where: { phone } });
    if (existingUser) {
      return ResponseHandler.error(res, 'Ce numéro est déjà enregistré', 400);
    }

    // ✅ Plus besoin d'OTP à l'inscription — compte vérifié directement
    const userData = {
      phone,
      password, // Sera haché par le hook beforeCreate
      firstName,
      lastName,
      role,
      city,
      quarter,
      isVerified: true,  // ✅ Vérifié directement
      isActive: true
    };

    // ==========================================
    // CAS REVENDEUR
    // ==========================================
    if (role === 'revendeur') {
      userData.businessName = businessName || null;
      userData.businessAddress = businessAddress || null;
      userData.validationStatus = 'approved';

      // ✅ SI TOKEN FOURNI : Vérifier l'invitation
      if (token) {
        console.log('🔍 Vérification token d\'invitation:', token);

        const invitation = await db.InvitationToken.findOne({
          where: { token },
          include: [{
            model: db.User,
            as: 'generator',
            attributes: ['id', 'firstName', 'lastName', 'role']
          }]
        });

        if (!invitation) {
          return ResponseHandler.error(res, 'Token d\'invitation invalide', 404);
        }

        if (invitation.status === 'used') {
          return ResponseHandler.error(res, 'Ce lien a déjà été utilisé', 400);
        }

        if (invitation.status === 'revoked') {
          return ResponseHandler.error(res, 'Ce lien a été révoqué', 400);
        }

        if (new Date() > new Date(invitation.expiresAt)) {
          await invitation.update({ status: 'expired' });
          return ResponseHandler.error(res, 'Ce lien a expiré', 400);
        }

        userData.metadata = {
          invitedBy: invitation.generatedBy,
          inviterType: invitation.generatorType,
          invitationId: invitation.id,
          registeredAt: new Date()
        };

        console.log('✅ Token valide - Invitation par:', invitation.generatorType);
      }

      // Essai gratuit automatique
      const pricingConfig = await db.Pricing.findOne({
        where: { targetRole: 'revendeur' }
      });

      if (pricingConfig && pricingConfig.isActive && pricingConfig.freeTrialDays > 0) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + pricingConfig.freeTrialDays);
        userData.freeTrialEndDate = trialEndDate;
        console.log(`✅ Essai gratuit de ${pricingConfig.freeTrialDays} jours activé`);
      }
    }

    // Créer l'utilisateur
    const user = await db.User.create(userData);

    // ✅ SI REVENDEUR AVEC TOKEN : Marquer le token comme utilisé
    if (role === 'revendeur' && token) {
      const invitation = await db.InvitationToken.findOne({ where: { token } });
      if (invitation) {
        await invitation.update({
          status: 'used',
          usedBy: user.id,
          usedByPhone: user.phone,
          usedAt: new Date()
        });

        // Stats agent
        if (invitation.generatorType === 'agent') {
          const agent = await db.User.findByPk(invitation.generatedBy);
          if (agent) {
            const stats = agent.agentStats || {};
            stats.totalSellersRecruited = (stats.totalSellersRecruited || 0) + 1;
            await agent.update({ agentStats: stats });
          }
        }

        console.log('✅ Token marqué comme utilisé');
      }
    }

    console.log(`✅ Utilisateur créé - ID: ${user.id}, Rôle: ${user.role}`);

    // ✅ Générer directement un token JWT — plus d'OTP nécessaire
    const jwtToken = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userResponse = {
      id: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      city: user.city,
      businessName: user.businessName || null,
      isVerified: true,
      validationStatus: user.validationStatus || null
    };

    console.log('✅ Inscription directe réussie pour:', phone, '| Rôle:', user.role);

    return ResponseHandler.success(
      res,
      'Inscription réussie. Bienvenue !',
      { token: jwtToken, user: userResponse },
      201
    );
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    return ResponseHandler.error(res, error.message || 'Erreur lors de l\'inscription', 500);
  }
};

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log('🔍 Tentative de connexion:', { phone, passwordLength: password?.length });

    if (!phone || !password) {
      return ResponseHandler.error(res, 'Téléphone et mot de passe requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (!user) {
      console.log('❌ Utilisateur non trouvé:', phone);
      return ResponseHandler.error(res, 'Identifiants incorrects', 401);
    }

    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      phone: user.phone,
      role: user.role,
      hasPassword: !!user.password
    });

    const isPasswordValid = await user.comparePassword(password);

    console.log('🔑 Vérification mot de passe:', { isValid: isPasswordValid });

    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect');
      return ResponseHandler.error(res, 'Identifiants incorrects', 401);
    }

    if (!user.isVerified) {
      return ResponseHandler.error(res, 'Compte non vérifié. Veuillez contacter le support', 403);
    }

    if (!user.isActive) {
      return ResponseHandler.error(res, 'Compte désactivé. Contactez le support', 403);
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userResponse = await db.User.findByPk(user.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    console.log('✅ Login réussi pour:', phone, 'Role:', user.role);

    return ResponseHandler.success(res, 'Connexion réussie', { token, user: userResponse });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    return ResponseHandler.error(res, 'Erreur lors de la connexion', 500);
  }
};

// @desc    Vérification OTP (utilisé uniquement pour mot de passe oublié)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    console.log('🔐 Vérification OTP:', { phone, otp });

    if (!phone || !otp) {
      return ResponseHandler.error(res, 'Téléphone et code OTP requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    if (user.otp !== otp) {
      return ResponseHandler.error(res, 'Code OTP invalide', 400);
    }

    if (new Date() > user.otpExpiry) {
      return ResponseHandler.error(res, 'Code OTP expiré', 400);
    }

    await user.update({
      otp: null,
      otpExpiry: null
    });

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Token JWT créé:', { userId: user.id, role: user.role });

    const userResponse = {
      id: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      city: user.city,
      businessName: user.businessName,
      isVerified: user.isVerified,
      validationStatus: user.validationStatus
    };

    return ResponseHandler.success(res, 'Code vérifié avec succès', { token, user: userResponse });

  } catch (error) {
    console.error('❌ Erreur vérification OTP:', error);
    return ResponseHandler.error(res, 'Erreur lors de la vérification', 500);
  }
};

// @desc    Renvoyer l'OTP (utilisé uniquement pour mot de passe oublié)
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return ResponseHandler.error(res, 'Numéro de téléphone requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await user.update({ otp, otpExpiry });

    console.log(`📱 Nouvel OTP pour ${phone}: ${otp}`);

    return ResponseHandler.success(res, 'Code OTP renvoyé avec succès', { otp, otpExpiry });

  } catch (error) {
    console.error('❌ Erreur renvoi OTP:', error);
    return ResponseHandler.error(res, 'Erreur lors du renvoi', 500);
  }
};

// @desc    Mot de passe oublié - envoi OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return ResponseHandler.error(res, 'Numéro de téléphone requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await user.update({ otp, otpExpiry });

    console.log(`🔐 OTP reset password pour ${phone}: ${otp}`);

    return ResponseHandler.success(res, 'Code de réinitialisation envoyé par SMS', { otp, otpExpiry });

  } catch (error) {
    console.error('❌ Erreur forgot password:', error);
    return ResponseHandler.error(res, 'Erreur lors de la demande de réinitialisation', 500);
  }
};

// @desc    Réinitialiser le mot de passe
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return ResponseHandler.error(res, 'Téléphone, OTP et nouveau mot de passe requis', 400);
    }

    const user = await db.User.findOne({ where: { phone } });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    if (user.otp !== otp) {
      return ResponseHandler.error(res, 'Code OTP invalide', 400);
    }

    if (new Date() > user.otpExpiry) {
      return ResponseHandler.error(res, 'Code OTP expiré', 400);
    }

    await user.update({
      password: newPassword, // Le hook beforeUpdate hashera
      otp: null,
      otpExpiry: null
    });

    console.log('✅ Mot de passe réinitialisé pour:', phone);

    return ResponseHandler.success(res, 'Mot de passe réinitialisé avec succès');

  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    return ResponseHandler.error(res, 'Erreur lors de la réinitialisation', 500);
  }
};

// @desc    Obtenir mon profil
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    return ResponseHandler.success(res, 'Profil récupéré', { user });
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    return ResponseHandler.error(res, 'Erreur serveur', 500);
  }
};

// @desc    Mise à jour du profil
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      firstName,
      lastName,
      email,
      businessName,
      businessDescription,
      quarter,
      latitude,
      longitude,
      businessPhoto,
      openingHours,
      deliveryAvailable,
      deliveryRadius,
      deliveryFee
    } = req.body;

    const user = await db.User.findByPk(userId);

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    const updates = {};

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email.trim() === '' ? null : email.trim();

    if (user.role === 'revendeur') {
      if (businessName !== undefined) updates.businessName = businessName;
      if (businessDescription !== undefined) updates.businessDescription = businessDescription;
      if (quarter !== undefined) updates.quarter = quarter;

      if (latitude !== undefined && latitude !== null) {
        const lat = parseFloat(latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return ResponseHandler.error(res, 'Latitude invalide', 400);
        }
        updates.latitude = lat;
      }

      if (longitude !== undefined && longitude !== null) {
        const lon = parseFloat(longitude);
        if (isNaN(lon) || lon < -180 || lon > 180) {
          return ResponseHandler.error(res, 'Longitude invalide', 400);
        }
        updates.longitude = lon;
      }

      if (businessPhoto !== undefined) updates.businessPhoto = businessPhoto;
      if (openingHours !== undefined) updates.openingHours = openingHours;

      if (user.validationStatus === 'approved') {
        if (deliveryAvailable !== undefined) updates.deliveryAvailable = deliveryAvailable;
        if (deliveryRadius !== undefined) updates.deliveryRadius = deliveryRadius;
        if (deliveryFee !== undefined) updates.deliveryFee = deliveryFee;
      }
    }

    await user.update(updates);

    const updatedUser = await db.User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    return ResponseHandler.success(res, 'Profil mis à jour avec succès', { user: updatedUser });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour du profil', 500);
  }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ResponseHandler.error(res, 'Mot de passe actuel et nouveau requis', 400);
    }

    const user = await db.User.findByPk(req.user.id);

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return ResponseHandler.error(res, 'Mot de passe actuel incorrect', 400);
    }

    await user.update({ password: newPassword }); // Le hook hashera

    console.log('✅ Mot de passe changé pour:', user.phone);

    return ResponseHandler.success(res, 'Mot de passe modifié avec succès');

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    return ResponseHandler.error(res, 'Erreur lors du changement de mot de passe', 500);
  }
};

// @desc    Mise à jour des paramètres de livraison
// @route   PUT /api/auth/update-delivery
// @access  Private (Revendeurs)
exports.updateDeliverySettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await db.User.findByPk(userId);

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    if (user.role !== 'revendeur') {
      return ResponseHandler.error(res, 'Cette action est réservée aux revendeurs', 403);
    }

    if (user.validationStatus !== 'approved') {
      return ResponseHandler.error(res, 'Votre compte doit être approuvé', 403);
    }

    const { deliveryAvailable, deliveryRadius, deliveryFee } = req.body;

    const updates = {};
    if (deliveryAvailable !== undefined) updates.deliveryAvailable = deliveryAvailable;
    if (deliveryRadius !== undefined) updates.deliveryRadius = deliveryRadius;
    if (deliveryFee !== undefined) updates.deliveryFee = deliveryFee;

    await user.update(updates);

    const updatedUser = await db.User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    return ResponseHandler.success(res, 'Paramètres de livraison mis à jour', { user: updatedUser });

  } catch (error) {
    console.error('❌ Erreur mise à jour livraison:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// @desc    Supprimer le compte
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  let transaction;

  try {
    const { password } = req.body;

    if (!password) {
      return ResponseHandler.error(res, 'Le mot de passe est requis', 400);
    }

    transaction = await db.sequelize.transaction();

    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Mot de passe incorrect', 401);
    }

    if (user.role === 'revendeur') {
      const pendingOrders = await db.Order.count({
        where: {
          sellerId: user.id,
          status: ['pending', 'accepted', 'preparing', 'in_delivery']
        }
      });

      if (pendingOrders > 0) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          `Impossible de supprimer. ${pendingOrders} commande(s) en cours.`,
          400
        );
      }

      await db.Product.destroy({ where: { sellerId: user.id }, transaction });
    }

    if (user.role === 'client') {
      const pendingOrders = await db.Order.count({
        where: {
          customerId: user.id,
          status: ['pending', 'accepted', 'preparing', 'in_delivery']
        }
      });

      if (pendingOrders > 0) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          `Impossible de supprimer. ${pendingOrders} commande(s) en cours.`,
          400
        );
      }
    }

    await db.Address.destroy({ where: { userId: user.id }, transaction });
    await db.Review.destroy({ where: { customerId: user.id }, transaction });
    await db.Notification.destroy({ where: { userId: user.id }, transaction });

    await user.destroy({ transaction });
    await transaction.commit();

    console.log(`✅ Compte ${user.id} supprimé`);

    return ResponseHandler.success(res, 'Votre compte a été supprimé avec succès');
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Erreur suppression compte:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression du compte', 500);
  }
};

// @desc    Demander la suppression du compte
// @route   POST /api/auth/request-account-deletion
// @access  Private
exports.requestAccountDeletion = async (req, res) => {
  try {
    const { password, reason } = req.body;

    if (!password) {
      return ResponseHandler.error(res, 'Le mot de passe est requis', 400);
    }

    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return ResponseHandler.error(res, 'Mot de passe incorrect', 401);
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await user.update({
      isActive: false,
      deletionRequestedAt: new Date(),
      scheduledDeletionDate: deletionDate,
      deletionReason: reason || null
    });

    console.log(`⏳ Suppression programmée pour ${user.id} le ${deletionDate}`);

    return ResponseHandler.success(
      res,
      `Votre compte sera supprimé le ${deletionDate.toLocaleDateString('fr-FR')}`
    );
  } catch (error) {
    console.error('❌ Erreur demande suppression:', error);
    return ResponseHandler.error(res, 'Erreur lors de la demande de suppression', 500);
  }
};

// @desc    Annuler la suppression du compte
// @route   POST /api/auth/cancel-account-deletion
// @access  Private
exports.cancelAccountDeletion = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    if (!user.deletionRequestedAt) {
      return ResponseHandler.error(res, 'Aucune demande de suppression en cours', 400);
    }

    await user.update({
      isActive: true,
      deletionRequestedAt: null,
      scheduledDeletionDate: null,
      deletionReason: null
    });

    console.log(`✅ Annulation suppression pour ${user.id}`);

    return ResponseHandler.success(res, 'La suppression a été annulée avec succès');
  } catch (error) {
    console.error('❌ Erreur annulation suppression:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'annulation', 500);
  }
};