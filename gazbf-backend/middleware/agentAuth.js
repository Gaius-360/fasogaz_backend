// ==========================================
// FICHIER: middleware/agentAuth.js
// Middleware pour protéger les routes agents et admin/agent
// ✅ CORRIGÉ - Support admin hardcodé
// ==========================================

const jwt = require('jsonwebtoken');
const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Configuration admin (cohérente avec adminAuth.js)
 */
const ADMIN_CONFIG = {
  id: 'admin-1',
  username: process.env.ADMIN_USERNAME || 'admin',
  role: 'admin',
  firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
  lastName: process.env.ADMIN_LAST_NAME || 'Principal',
  email: process.env.ADMIN_EMAIL || 'admin@gazbf.bf'
};

/**
 * Protéger les routes accessibles uniquement aux agents
 */
const protectAgent = async (req, res, next) => {
  try {
    // Récupérer le token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(
        res,
        'Accès non autorisé - Token manquant',
        401
      );
    }

    const token = authHeader.substring(7);

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const user = await db.User.findByPk(decoded.id);

    if (!user) {
      return ResponseHandler.error(
        res,
        'Utilisateur non trouvé',
        404
      );
    }

    // Vérifier que c'est bien un agent
    if (user.role !== 'agent') {
      return ResponseHandler.error(
        res,
        'Accès réservé aux agents',
        403
      );
    }

    // Vérifier que le compte agent est actif
    if (user.agentStatus !== 'active') {
      return ResponseHandler.error(
        res,
        'Compte agent inactif ou suspendu',
        403
      );
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur authentification agent:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler.error(res, 'Token invalide', 401);
    }
    
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler.error(res, 'Token expiré', 401);
    }
    
    return ResponseHandler.error(
      res,
      'Erreur d\'authentification',
      500
    );
  }
};

/**
 * Protéger les routes accessibles aux admin ET aux agents
 * ✅ CORRECTION: Gérer le cas de l'admin hardcodé
 */
const protectAdminOrAgent = async (req, res, next) => {
  try {
    // Récupérer le token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(
        res,
        'Accès non autorisé - Token manquant',
        401
      );
    }

    const token = authHeader.substring(7);

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return ResponseHandler.error(res, 'Token expiré', 401);
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return ResponseHandler.error(res, 'Token invalide', 401);
      }
      throw jwtError;
    }

    console.log('🔍 [protectAdminOrAgent] Token décodé:', {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username
    });

    // ✅ CAS 1: Si c'est l'admin hardcodé
    if (decoded.role === 'admin' && decoded.id === ADMIN_CONFIG.id) {
      console.log('✅ [protectAdminOrAgent] Admin hardcodé authentifié');
      
      req.user = {
        id: ADMIN_CONFIG.id,
        username: ADMIN_CONFIG.username,
        role: ADMIN_CONFIG.role,
        firstName: ADMIN_CONFIG.firstName,
        lastName: ADMIN_CONFIG.lastName,
        email: ADMIN_CONFIG.email
      };
      
      return next();
    }

    // ✅ CAS 2: Si c'est un agent, chercher dans la DB
    const user = await db.User.findByPk(decoded.id);

    if (!user) {
      console.log('❌ [protectAdminOrAgent] Utilisateur non trouvé:', decoded.id);
      return ResponseHandler.error(
        res,
        'Utilisateur non trouvé',
        404
      );
    }

    // Vérifier que c'est admin OU agent
    if (user.role !== 'admin' && user.role !== 'agent') {
      console.log('❌ [protectAdminOrAgent] Rôle non autorisé:', user.role);
      return ResponseHandler.error(
        res,
        'Accès réservé aux administrateurs et agents',
        403
      );
    }

    // Pour les agents, vérifier le statut
    if (user.role === 'agent' && user.agentStatus !== 'active') {
      console.log('❌ [protectAdminOrAgent] Agent inactif');
      return ResponseHandler.error(
        res,
        'Compte agent inactif ou suspendu',
        403
      );
    }

    console.log('✅ [protectAdminOrAgent] Agent authentifié:', user.agentCode);

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    
    return ResponseHandler.error(
      res,
      'Erreur d\'authentification',
      500
    );
  }
};

module.exports = {
  protectAgent,
  protectAdminOrAgent
};