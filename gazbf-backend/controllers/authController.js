// ==========================================
// FICHIER: controllers/authController.js
// ==========================================
const db = require('../models');
const generateToken = require('../utils/generateToken');
const generateOTP = require('../utils/generateOTP');
const sendSMS = require('../utils/sendSMS');
const ResponseHandler = require('../utils/responseHandler');

// Stocker temporairement les OTP (en production, utiliser Redis)
const otpStore = new Map();

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { phone, password, role, firstName, lastName, city } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.User.findOne({ where: { phone } });
    if (existingUser) {
      return ResponseHandler.error(res, 'Ce numéro de téléphone est déjà utilisé', 409);
    }

    // Créer l'utilisateur
    const user = await db.User.create({
      phone,
      password,
      role,
      firstName,
      lastName,
      city,
      isVerified: false
    });

    // Générer OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Stocker l'OTP
    otpStore.set(phone, { otp, expiry: otpExpiry, userId: user.id });

    // Envoyer SMS
    await sendSMS(phone, `Votre code de vérification GAZBF est: ${otp}. Valide 5 minutes.`);

    return ResponseHandler.success(
      res,
      'Inscription réussie. Un code de vérification a été envoyé par SMS.',
      {
        userId: user.id,
        phone: user.phone,
        role: user.role
      },
      201
    );
  } catch (error) {
    console.error('Erreur inscription:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'inscription', 500);
  }
};

// @desc    Vérifier le code OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return ResponseHandler.error(res, 'Téléphone et code OTP requis', 400);
    }

    // Récupérer l'OTP stocké
    const storedData = otpStore.get(phone);

    if (!storedData) {
      return ResponseHandler.error(res, 'Code OTP non trouvé ou expiré', 400);
    }

    // Vérifier l'expiration
    if (Date.now() > storedData.expiry) {
      otpStore.delete(phone);
      return ResponseHandler.error(res, 'Code OTP expiré. Demandez-en un nouveau.', 400);
    }

    // Vérifier le code
    if (storedData.otp !== otp) {
      return ResponseHandler.error(res, 'Code OTP incorrect', 400);
    }

    // Marquer l'utilisateur comme vérifié
    const user = await db.User.findByPk(storedData.userId);
    await user.update({ isVerified: true });

    // Supprimer l'OTP
    otpStore.delete(phone);

    // Générer le token JWT
    const token = generateToken(user.id);

    return ResponseHandler.success(
      res,
      'Compte vérifié avec succès',
      {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          city: user.city,
          isVerified: user.isVerified
        }
      }
    );
  } catch (error) {
    console.error('Erreur vérification OTP:', error);
    return ResponseHandler.error(res, 'Erreur lors de la vérification', 500);
  }
};

// @desc    Renvoyer le code OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return ResponseHandler.error(res, 'Numéro de téléphone requis', 400);
    }

    // Vérifier si l'utilisateur existe
    const user = await db.User.findOne({ where: { phone } });
    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    if (user.isVerified) {
      return ResponseHandler.error(res, 'Ce compte est déjà vérifié', 400);
    }

    // Générer un nouveau OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    otpStore.set(phone, { otp, expiry: otpExpiry, userId: user.id });

    // Envoyer SMS
    await sendSMS(phone, `Votre nouveau code GAZBF: ${otp}. Valide 5 minutes.`);

    return ResponseHandler.success(res, 'Nouveau code OTP envoyé par SMS');
  } catch (error) {
    console.error('Erreur renvoi OTP:', error);
    return ResponseHandler.error(res, 'Erreur lors du renvoi du code', 500);
  }
};

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await db.User.findOne({
      where: { phone },
      include: [
        {
          model: db.Subscription,
          as: 'subscription'
        }
      ]
    });

    if (!user) {
      return ResponseHandler.error(res, 'Identifiants incorrects', 401);
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ResponseHandler.error(res, 'Identifiants incorrects', 401);
    }

    // Vérifier si le compte est vérifié
    if (!user.isVerified) {
      return ResponseHandler.error(
        res,
        'Compte non vérifié. Veuillez vérifier votre numéro de téléphone.',
        403
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

    // Générer le token
    const token = generateToken(user.id);

    // Préparer les données utilisateur (sans le mot de passe)
    const userData = {
      id: user.id,
      phone: user.phone,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      city: user.city,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified
    };

    // Ajouter les infos spécifiques selon le rôle
    if (user.role === 'revendeur') {
      userData.businessName = user.businessName;
      userData.quarter = user.quarter;
      userData.validationStatus = user.validationStatus;
      userData.averageRating = user.averageRating;
      userData.totalReviews = user.totalReviews;
    }

    // Ajouter les infos d'abonnement
    if (user.subscription) {
      userData.subscription = {
        planType: user.subscription.planType,
        isActive: user.subscription.isActive,
        endDate: user.subscription.endDate
      };
    }

    return ResponseHandler.success(
      res,
      'Connexion réussie',
      {
        token,
        user: userData
      }
    );
  } catch (error) {
    console.error('Erreur connexion:', error);
    return ResponseHandler.error(res, 'Erreur lors de la connexion', 500);
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Subscription,
          as: 'subscription'
        },
        {
          model: db.Address,
          as: 'addresses'
        }
      ]
    });

    return ResponseHandler.success(res, 'Profil récupéré', user);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération du profil', 500);
  }
};

// @desc    Mettre à jour le profil
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'email', 'profilePicture'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Pour les revendeurs
    if (req.user.role === 'revendeur') {
      const sellerFields = [
        'businessName',
        'businessDescription',
        'quarter',
        'latitude',
        'longitude',
        'businessPhoto',
        'openingHours',
        'deliveryAvailable',
        'deliveryRadius',
        'deliveryFee'
      ];
      
      sellerFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
    }

    await req.user.update(updates);

    return ResponseHandler.success(res, 'Profil mis à jour avec succès', {
      user: await db.User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      })
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ResponseHandler.error(res, 'Mots de passe requis', 400);
    }

    // Vérifier le mot de passe actuel
    const user = await db.User.findByPk(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return ResponseHandler.error(res, 'Mot de passe actuel incorrect', 401);
    }

    // Mettre à jour le mot de passe
    await user.update({ password: newPassword });

    return ResponseHandler.success(res, 'Mot de passe modifié avec succès');
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    return ResponseHandler.error(res, 'Erreur lors du changement de mot de passe', 500);
  }
};