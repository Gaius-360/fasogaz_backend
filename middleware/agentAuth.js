// ==========================================
// FICHIER: middleware/agentAuth.js
// ✅ VERSION FINALE
//    - isAgentActive (booléen) corrigé
//    - Admin vérifié en BDD (plus de hardcoding)
// ==========================================

const jwt = require('jsonwebtoken');
const db  = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// ==========================================
// protectAgent : routes accessibles aux agents uniquement
// ==========================================
const protectAgent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(res, 'Accès non autorisé - Token manquant', 401);
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError')
        return ResponseHandler.error(res, 'Token expiré', 401);
      if (jwtError.name === 'JsonWebTokenError')
        return ResponseHandler.error(res, 'Token invalide', 401);
      throw jwtError;
    }

    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    if (user.role !== 'agent') {
      return ResponseHandler.error(res, 'Accès réservé aux agents', 403);
    }

    // ✅ CORRECTION : isAgentActive (booléen du modèle User)
    //    Ancienne version incorrecte : user.agentStatus !== 'active'
    if (!user.isAgentActive) {
      return ResponseHandler.error(
        res, 'Compte agent désactivé. Contactez un administrateur.', 403
      );
    }

    if (!user.isActive) {
      return ResponseHandler.error(res, 'Compte désactivé. Contactez le support.', 403);
    }

    req.user  = user;
    req.agent = user; // alias pratique dans les contrôleurs
    next();

  } catch (error) {
    console.error('❌ Erreur authentification agent:', error);
    return ResponseHandler.error(res, 'Erreur d\'authentification', 500);
  }
};

// ==========================================
// protectAdminOrAgent : routes accessibles admin ET agents
// ==========================================
const protectAdminOrAgent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(res, 'Accès non autorisé - Token manquant', 401);
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      // Tenter d'abord comme token admin (issuer/audience spécifiques)
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
          issuer:   'fasogaz-admin',
          audience: 'admin-panel'
        });
      } catch {
        // Pas un token admin → vérifier comme token agent standard
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      }
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError')
        return ResponseHandler.error(res, 'Token expiré', 401);
      if (jwtError.name === 'JsonWebTokenError')
        return ResponseHandler.error(res, 'Token invalide', 401);
      throw jwtError;
    }

    // Chercher l'utilisateur en BDD (admin ou agent)
    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    if (!user) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    if (user.role !== 'admin' && user.role !== 'agent') {
      return ResponseHandler.error(
        res, 'Accès réservé aux administrateurs et agents', 403
      );
    }

    if (!user.isActive) {
      return ResponseHandler.error(res, 'Compte désactivé. Contactez le support.', 403);
    }

    // ✅ Vérification isAgentActive pour les agents
    if (user.role === 'agent' && !user.isAgentActive) {
      return ResponseHandler.error(res, 'Compte agent désactivé ou suspendu', 403);
    }

    req.user  = user;
    req.agent = user.role === 'agent' ? user : null;
    next();

  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    return ResponseHandler.error(res, 'Erreur d\'authentification', 500);
  }
};

module.exports = { protectAgent, protectAdminOrAgent };