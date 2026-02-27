// ==========================================
// FICHIER: middleware/validator.js
// ==========================================
const ResponseHandler = require('../utils/responseHandler');

// Valider le format du numéro de téléphone burkinabé
exports.validatePhone = (phone) => {
  const phoneRegex = /^\+226[0-9]{8}$/;
  return phoneRegex.test(phone);
};

// Valider le mot de passe
exports.validatePassword = (password) => {
  // Au moins 8 caractères
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins 8 caractères'
    };
  }
  
  // Au moins une lettre et un chiffre
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une lettre et un chiffre'
    };
  }
  
  return { valid: true };
};

// Middleware de validation d'inscription
exports.validateRegistration = (req, res, next) => {
  const { role } = req.body;

  // ✅ FIX: Suppression des espaces dans le numéro de téléphone
  const phone = req.body.phone ? req.body.phone.replace(/\s/g, '') : req.body.phone;
  const password = req.body.password;
  req.body.phone = phone; // Mettre à jour req.body avec la valeur nettoyée

  const errors = [];

  // Vérifier le téléphone
  if (!phone) {
    errors.push({ field: 'phone', message: 'Le numéro de téléphone est requis' });
  } else if (!exports.validatePhone(phone)) {
    errors.push({ field: 'phone', message: 'Format de téléphone invalide. Utilisez +226XXXXXXXX' });
  }

  // Vérifier le mot de passe
  if (!password) {
    errors.push({ field: 'password', message: 'Le mot de passe est requis' });
  } else {
    const passwordValidation = exports.validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push({ field: 'password', message: passwordValidation.message });
    }
  }

  // Vérifier le rôle
  if (!role) {
    errors.push({ field: 'role', message: 'Le rôle est requis' });
  } else if (!['client', 'revendeur'].includes(role)) {
    errors.push({ field: 'role', message: 'Rôle invalide. Choisissez "client" ou "revendeur"' });
  }

  if (errors.length > 0) {
    return ResponseHandler.validationError(res, errors);
  }

  next();
};

// Middleware de validation de connexion
exports.validateLogin = (req, res, next) => {
  // ✅ FIX: Suppression des espaces dans le numéro de téléphone
  const phone = req.body.phone ? req.body.phone.replace(/\s/g, '') : req.body.phone;
  const password = req.body.password;
  req.body.phone = phone; // Mettre à jour req.body avec la valeur nettoyée

  const errors = [];

  if (!phone) {
    errors.push({ field: 'phone', message: 'Le numéro de téléphone est requis' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Le mot de passe est requis' });
  }

  if (errors.length > 0) {
    return ResponseHandler.validationError(res, errors);
  }

  next();
};