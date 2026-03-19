// ==========================================
// FICHIER: middleware/adminAuth.js
// ✅ VERSION FINALE — Vérifie l'admin en BDD (plus de hardcoding)
// ==========================================

const jwt = require('jsonwebtoken');
const db  = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// ==========================================
// protectAdmin : vérifie le JWT et l'existence en BDD
// ==========================================
exports.protectAdmin = async (req, res, next) => {
  try {
    // 1. Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(res, 'Non autorisé - Authentification requise', 401);
    }

    const token = authHeader.split(' ')[1];

    // 2. Vérifier et décoder le JWT (avec issuer/audience admin)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer:   'fasogaz-admin',
        audience: 'admin-panel'
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return ResponseHandler.error(res, 'Session expirée - Veuillez vous reconnecter', 401);
      }
      return ResponseHandler.error(res, 'Token invalide', 401);
    }

    // 3. Vérifier le rôle dans le payload du token
    if (decoded.role !== 'admin') {
      return ResponseHandler.error(res, 'Accès refusé - Droits administrateur requis', 403);
    }

    // 4. Vérifier que l'admin existe toujours en BDD et est actif
    const admin = await db.User.findOne({
      where: { id: decoded.id, role: 'admin' },
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    if (!admin) {
      return ResponseHandler.error(res, 'Administrateur non trouvé', 403);
    }

    if (!admin.isActive) {
      return ResponseHandler.error(res, 'Compte administrateur désactivé', 403);
    }

    // 5. Attacher l'admin à la requête pour les contrôleurs suivants
    req.user = admin;
    next();

  } catch (error) {
    console.error('❌ Erreur middleware admin:', error);
    return ResponseHandler.error(res, 'Erreur serveur', 500);
  }
};

// ==========================================
// logAdminAction : middleware de log des actions admin
// ==========================================
exports.logAdminAction = (action) => {
  return (req, res, next) => {
    console.log('📝 [Admin Action]', {
      action,
      adminId:    req.user?.id,
      adminEmail: req.user?.email,
      ip:         req.ip,
      timestamp:  new Date().toISOString(),
      path:       req.path,
      method:     req.method
    });
    next();
  };
};