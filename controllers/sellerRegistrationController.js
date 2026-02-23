// ==========================================
// FICHIER: controllers/sellerRegistrationController.js
// Inscription revendeur UNIQUEMENT via lien d'invitation
// ==========================================

const jwt = require('jsonwebtoken');
const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const generateOTP = require('../utils/generateOTP');

/**
 * Inscription revendeur via token d'invitation
 * @route   POST /api/auth/register-seller
 * @access  Public (mais nécessite un token valide)
 */
exports.registerSellerWithToken = async (req, res) => {
  try {
    const {
      token,           // Token d'invitation (OBLIGATOIRE)
      phone,
      password,
      firstName,
      lastName,
      city,
      businessName,
      quarter,
      businessAddress
    } = req.body;

    // ==========================================
    // 1. VALIDATION DU TOKEN D'INVITATION
    // ==========================================
    if (!token) {
      return ResponseHandler.error(
        res,
        'Token d\'invitation requis. Vous devez avoir reçu un lien d\'invitation pour vous inscrire.',
        400
      );
    }

    const invitation = await db.InvitationToken.findOne({
      where: { token },
      include: [{
        model: db.User,
        as: 'generator',
        attributes: ['id', 'firstName', 'lastName', 'role']
      }]
    });

    if (!invitation) {
      return ResponseHandler.error(
        res,
        'Lien d\'invitation invalide. Veuillez contacter un agent ou administrateur.',
        404
      );
    }

    // Vérifier que le token n'a pas déjà été utilisé
    if (invitation.status === 'used') {
      return ResponseHandler.error(
        res,
        'Ce lien a déjà été utilisé. Demandez un nouveau lien.',
        400
      );
    }

    // Vérifier que le token n'est pas révoqué
    if (invitation.status === 'revoked') {
      return ResponseHandler.error(
        res,
        'Ce lien a été révoqué. Contactez l\'administrateur.',
        400
      );
    }

    // Vérifier l'expiration
    if (new Date() > new Date(invitation.expiresAt)) {
      await invitation.update({ status: 'expired' });
      return ResponseHandler.error(
        res,
        'Ce lien a expiré. Demandez un nouveau lien.',
        400
      );
    }

    // ==========================================
    // 2. VALIDATION DES DONNÉES
    // ==========================================
    if (!phone || !password || !firstName || !lastName || !city || !businessName) {
      return ResponseHandler.error(
        res,
        'Tous les champs obligatoires doivent être remplis',
        400
      );
    }

    // Vérifier si le numéro existe déjà
    const existingUser = await db.User.findOne({ where: { phone } });
    if (existingUser) {
      return ResponseHandler.error(
        res,
        'Ce numéro de téléphone est déjà enregistré',
        400
      );
    }

    // ==========================================
    // 3. CRÉATION DU COMPTE REVENDEUR
    // ==========================================
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const userData = {
      phone,
      password, // Sera haché automatiquement par le hook beforeCreate
      firstName,
      lastName,
      role: 'revendeur',
      city,
      quarter: quarter || null,
      businessName,
      businessAddress: businessAddress || null,
      
      // ✅ STATUT ACTIF IMMÉDIATEMENT (pas de validation manuelle)
      validationStatus: 'approved',
      
      // OTP pour vérification téléphone
      otp,
      otpExpiry,
      isVerified: false, // Sera vérifié après OTP
      
      // Traçabilité
      metadata: {
        invitedBy: invitation.generatedBy,
        inviterType: invitation.generatorType,
        invitationId: invitation.id,
        registeredAt: new Date()
      }
    };

    // ✅ Essai gratuit automatique si configuré
    const pricingConfig = await db.Pricing.findOne({
      where: { targetRole: 'revendeur' }
    });

    if (pricingConfig && pricingConfig.isActive && pricingConfig.freeTrialDays > 0) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + pricingConfig.freeTrialDays);
      userData.freeTrialEndDate = trialEndDate;
      
      console.log(`✅ Essai gratuit de ${pricingConfig.freeTrialDays} jours activé`);
    }

    // Créer l'utilisateur
    const seller = await db.User.create(userData);

    // ==========================================
    // 4. MARQUER LE TOKEN COMME UTILISÉ
    // ==========================================
    await invitation.markAsUsed(seller.id, seller.phone);

    // ==========================================
    // 5. METTRE À JOUR LES STATS DE L'AGENT
    // ==========================================
    if (invitation.generatorType === 'agent') {
      const agent = await db.User.findByPk(invitation.generatedBy);
      if (agent) {
        const stats = agent.agentStats || {
          totalInvitationsSent: 0,
          totalSellersRecruited: 0
        };

        stats.totalSellersRecruited = (stats.totalSellersRecruited || 0) + 1;
        await agent.update({ agentStats: stats });
      }
    }

    // ==========================================
    // 6. CRÉER UNE NOTIFICATION DE BIENVENUE
    // ==========================================
    await db.Notification.create({
      userId: seller.id,
      type: 'system',
      title: '🎉 Bienvenue sur FasoGaz !',
      message: `Votre compte revendeur a été créé avec succès. Vérifiez votre OTP pour commencer.`,
      priority: 'high'
    });

    console.log(`✅ Revendeur créé via invitation - ID: ${seller.id}`);
    console.log(`📱 OTP envoyé à ${phone}: ${otp}`);

    // ==========================================
    // 7. RÉPONSE
    // ==========================================
    return ResponseHandler.success(
      res,
      'Inscription réussie ! Vérifiez votre code OTP.',
      {
        userId: seller.id,
        phone: seller.phone,
        role: seller.role,
        validationStatus: seller.validationStatus,
        invitedBy: invitation.generator ? {
          name: `${invitation.generator.firstName} ${invitation.generator.lastName}`,
          type: invitation.generator.role
        } : null,
        otp // ⚠️ À retirer en production
      },
      201
    );

  } catch (error) {
    console.error('❌ Erreur inscription revendeur:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de l\'inscription',
      500
    );
  }
};

/**
 * Vérifier OTP du revendeur
 * @route   POST /api/auth/verify-seller-otp
 * @access  Public
 */
exports.verifySellerOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return ResponseHandler.error(
        res,
        'Téléphone et code OTP requis',
        400
      );
    }

    const seller = await db.User.findOne({
      where: {
        phone,
        role: 'revendeur'
      }
    });

    if (!seller) {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    if (seller.isVerified) {
      return ResponseHandler.error(res, 'Compte déjà vérifié', 400);
    }

    if (seller.otp !== otp) {
      return ResponseHandler.error(res, 'Code OTP invalide', 400);
    }

    if (new Date() > seller.otpExpiry) {
      return ResponseHandler.error(res, 'Code OTP expiré', 400);
    }

    // Vérifier et activer le compte
    await seller.update({
      isVerified: true,
      isActive: true,
      otp: null,
      otpExpiry: null
    });

    // Générer le token JWT
    const token = jwt.sign(
      { id: seller.id, phone: seller.phone, role: seller.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const sellerResponse = {
      id: seller.id,
      phone: seller.phone,
      role: seller.role,
      city: seller.city,
      firstName: seller.firstName,
      lastName: seller.lastName,
      businessName: seller.businessName,
      isVerified: seller.isVerified,
      validationStatus: seller.validationStatus
    };

    // Notification de succès
    await db.Notification.create({
      userId: seller.id,
      type: 'system',
      title: '✅ Compte vérifié !',
      message: 'Votre compte est maintenant actif. Commencez à vendre dès maintenant !',
      priority: 'high',
      actionUrl: '/seller/dashboard'
    });

    return ResponseHandler.success(
      res,
      'Compte vérifié et activé avec succès',
      { token, user: sellerResponse }
    );

  } catch (error) {
    console.error('❌ Erreur vérification OTP:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors de la vérification',
      500
    );
  }
};

/**
 * Renvoyer l'OTP pour un revendeur
 * @route   POST /api/auth/resend-seller-otp
 * @access  Public
 */
exports.resendSellerOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return ResponseHandler.error(res, 'Numéro de téléphone requis', 400);
    }

    const seller = await db.User.findOne({
      where: {
        phone,
        role: 'revendeur'
      }
    });

    if (!seller) {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    if (seller.isVerified) {
      return ResponseHandler.error(res, 'Compte déjà vérifié', 400);
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await seller.update({ otp, otpExpiry });

    console.log(`📱 Nouvel OTP pour ${phone}: ${otp}`);

    return ResponseHandler.success(
      res,
      'Code OTP renvoyé avec succès',
      { otpExpiry }
    );

  } catch (error) {
    console.error('❌ Erreur renvoi OTP:', error);
    return ResponseHandler.error(res, 'Erreur lors du renvoi', 500);
  }
};