// ==========================================
// FICHIER: middleware/adminAuth.js
// Middleware de protection des routes admin - VERSION SÉCURISÉE
// ==========================================

const jwt = require('jsonwebtoken');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Configuration admin (cohérente avec le contrôleur)
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
 * Middleware pour protéger les routes admin
 * Vérifie le JWT et s'assure que l'utilisateur est admin
 */
exports.protectAdmin = async (req, res, next) => {
  try {
    let token;

    // 1. Récupérer le token depuis le header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Vérifier la présence du token
    if (!token) {
      console.log('❌ [Admin Auth] Pas de token fourni', {
        ip: req.ip,
        path: req.path
      });
      
      return ResponseHandler.error(
        res,
        'Non autorisé - Authentification requise',
        401
      );
    }

    try {
      // 3. Vérifier et décoder le token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev_secret_change_in_production',
        {
          issuer: 'fasogaz-admin',
          audience: 'admin-panel'
        }
      );

      console.log('🔓 [Admin Auth] Token décodé:', {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username
      });

      // 4. Vérifier que le token est pour un admin
      if (decoded.role !== 'admin') {
        console.log('❌ [Admin Auth] Rôle non admin:', decoded.role);
        
        return ResponseHandler.error(
          res,
          'Accès refusé - Droits administrateur requis',
          403
        );
      }

      // 5. Vérifier que l'ID correspond
      if (decoded.id !== ADMIN_CONFIG.id) {
        console.log('❌ [Admin Auth] ID admin invalide:', decoded.id);
        
        return ResponseHandler.error(
          res,
          'Admin non reconnu',
          403
        );
      }

      // 6. Attacher les informations admin à la requête
      req.user = {
        id: ADMIN_CONFIG.id,
        username: ADMIN_CONFIG.username,
        role: ADMIN_CONFIG.role,
        firstName: ADMIN_CONFIG.firstName,
        lastName: ADMIN_CONFIG.lastName,
        email: ADMIN_CONFIG.email
      };

      console.log('✅ [Admin Auth] Admin authentifié:', {
        username: ADMIN_CONFIG.username,
        path: req.path
      });

      next();

    } catch (jwtError) {
      // Gestion des erreurs JWT spécifiques
      if (jwtError.name === 'TokenExpiredError') {
        console.log('❌ [Admin Auth] Token expiré');
        return ResponseHandler.error(
          res,
          'Session expirée - Veuillez vous reconnecter',
          401
        );
      }

      if (jwtError.name === 'JsonWebTokenError') {
        console.log('❌ [Admin Auth] Token invalide:', jwtError.message);
        return ResponseHandler.error(
          res,
          'Token invalide',
          401
        );
      }

      console.error('❌ [Admin Auth] Erreur JWT:', jwtError);
      return ResponseHandler.error(
        res,
        'Erreur d\'authentification',
        401
      );
    }

  } catch (error) {
    console.error('❌ [Admin Auth] Erreur middleware:', error);
    return ResponseHandler.error(
      res,
      'Erreur serveur',
      500
    );
  }
};

/**
 * Middleware optionnel pour logger les actions admin
 */
exports.logAdminAction = (action) => {
  return (req, res, next) => {
    console.log('📝 [Admin Action]', {
      action,
      admin: req.user?.username,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
    next();
  };
};