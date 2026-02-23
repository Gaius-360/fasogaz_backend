// ==========================================
// FICHIER: controllers/adminAuthController.js
// VERSION PRODUCTION PURE - Sans mode test
// ==========================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ResponseHandler = require('../utils/responseHandler');

// ==========================================
// CONFIGURATION PRODUCTION
// ==========================================

/**
 * Configuration admin depuis variables d'environnement
 * AUCUNE valeur par défaut - Tout doit être défini dans .env
 */
const ADMIN_CONFIG = {
  id: process.env.ADMIN_ID || 'admin-1',
  username: process.env.ADMIN_USERNAME,
  passwordHash: process.env.ADMIN_PASSWORD_HASH,
  role: 'admin',
  firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
  lastName: process.env.ADMIN_LAST_NAME || 'Principal',
  email: process.env.ADMIN_EMAIL
};

// ==========================================
// VALIDATION AU DÉMARRAGE
// ==========================================

/**
 * Vérifier que toutes les variables obligatoires sont définies
 */
const validateConfig = () => {
  const required = {
    'ADMIN_USERNAME': ADMIN_CONFIG.username,
    'ADMIN_PASSWORD_HASH': ADMIN_CONFIG.passwordHash,
    'ADMIN_EMAIL': ADMIN_CONFIG.email,
    'JWT_SECRET': process.env.JWT_SECRET
  };

  const missing = [];
  
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ ERREUR DE CONFIGURATION CRITIQUE\n');
    console.error('Variables manquantes dans .env:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\n📖 Consultez README_SECURITE.md pour la configuration\n');
    process.exit(1);
  }

  // Vérifier le format du hash bcrypt
  const bcryptPattern = /^\$2[ayb]\$.{56}$/;
  if (!bcryptPattern.test(ADMIN_CONFIG.passwordHash)) {
    console.error('\n❌ ERREUR: ADMIN_PASSWORD_HASH invalide\n');
    console.error('Le hash doit être au format bcrypt ($2a$12$...)');
    console.error('Générez-le avec: npm run generate-admin-password\n');
    process.exit(1);
  }

  // Vérifier la longueur du JWT_SECRET
  if (process.env.JWT_SECRET.length < 32) {
    console.error('\n❌ ERREUR: JWT_SECRET trop court\n');
    console.error('Le secret doit contenir au moins 32 caractères');
    console.error('Générez-le avec: npm run generate-jwt-secret\n');
    process.exit(1);
  }

  console.log('✅ Configuration admin validée avec succès');
};

// Valider au démarrage du serveur
validateConfig();

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

/**
 * Obtenir les données admin (sans le mot de passe)
 */
const getAdminData = () => ({
  id: ADMIN_CONFIG.id,
  username: ADMIN_CONFIG.username,
  role: ADMIN_CONFIG.role,
  firstName: ADMIN_CONFIG.firstName,
  lastName: ADMIN_CONFIG.lastName,
  email: ADMIN_CONFIG.email
});

/**
 * Vérifier le mot de passe admin avec bcrypt
 */
const verifyAdminPassword = async (password) => {
  try {
    return await bcrypt.compare(password, ADMIN_CONFIG.passwordHash);
  } catch (error) {
    console.error('❌ Erreur vérification mot de passe:', error);
    return false;
  }
};

// ==========================================
// CONTRÔLEURS
// ==========================================

/**
 * @desc    Login admin avec sécurité production
 * @route   POST /api/admin/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Log sécurisé (jamais le mot de passe)
    console.log('🔐 Tentative login admin:', { 
      username,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Validation des champs
    if (!username || !password) {
      console.log('❌ Login échoué: champs manquants');
      return ResponseHandler.error(
        res,
        'Nom d\'utilisateur et mot de passe requis',
        400
      );
    }

    // Vérifier le nom d'utilisateur
    if (username !== ADMIN_CONFIG.username) {
      console.log('❌ Login échoué: nom d\'utilisateur incorrect');
      
      // Message générique pour éviter l'énumération
      return ResponseHandler.error(
        res,
        'Identifiants incorrects',
        401
      );
    }

    // Vérifier le mot de passe avec bcrypt
    const isPasswordValid = await verifyAdminPassword(password);

    if (!isPasswordValid) {
      console.log('❌ Login échoué: mot de passe incorrect');
      
      return ResponseHandler.error(
        res,
        'Identifiants incorrects',
        401
      );
    }

    // Générer le token JWT sécurisé
    const token = jwt.sign(
      {
        id: ADMIN_CONFIG.id,
        role: ADMIN_CONFIG.role,
        username: ADMIN_CONFIG.username
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'fasogaz-admin',
        audience: 'admin-panel'
      }
    );

    console.log('✅ Login admin réussi:', {
      username: ADMIN_CONFIG.username,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Retourner le token et les données admin
    return ResponseHandler.success(
      res,
      'Connexion admin réussie',
      {
        token,
        admin: getAdminData()
      }
    );

  } catch (error) {
    console.error('❌ Erreur login admin:', error);
    return ResponseHandler.error(
      res, 
      'Erreur lors de la connexion', 
      500
    );
  }
};

/**
 * @desc    Obtenir le profil admin
 * @route   GET /api/admin/auth/profile
 * @access  Private (Admin only)
 */
exports.getProfile = async (req, res) => {
  try {
    // req.user est défini par le middleware protectAdmin
    if (!req.user || req.user.id !== ADMIN_CONFIG.id) {
      return ResponseHandler.error(res, 'Admin non trouvé', 404);
    }

    return ResponseHandler.success(
      res,
      'Profil admin récupéré',
      getAdminData()
    );

  } catch (error) {
    console.error('❌ Erreur profil admin:', error);
    return ResponseHandler.error(
      res, 
      'Erreur lors de la récupération du profil', 
      500
    );
  }
};

/**
 * @desc    Changer le mot de passe admin
 * @route   PUT /api/admin/auth/change-password
 * @access  Private (Admin only)
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return ResponseHandler.error(
        res, 
        'Mots de passe requis', 
        400
      );
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await verifyAdminPassword(currentPassword);

    if (!isCurrentPasswordValid) {
      console.log('❌ Changement MDP échoué: mot de passe actuel incorrect');
      return ResponseHandler.error(
        res, 
        'Mot de passe actuel incorrect', 
        401
      );
    }

    // Valider le nouveau mot de passe
    const passwordValidation = validateNewPassword(newPassword);
    if (!passwordValidation.valid) {
      return ResponseHandler.error(
        res,
        passwordValidation.error,
        400
      );
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await bcrypt.compare(newPassword, ADMIN_CONFIG.passwordHash);

    if (isSamePassword) {
      return ResponseHandler.error(
        res,
        'Le nouveau mot de passe doit être différent de l\'ancien',
        400
      );
    }

    // Générer le nouveau hash
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // ⚠️ IMPORTANT: En production avec BDD, sauvegarder dans la base
    // Pour l'instant, mise à jour en mémoire (temporaire)
    ADMIN_CONFIG.passwordHash = newPasswordHash;

    console.log('✅ Mot de passe admin changé avec succès');
    console.log('\n⚠️  ACTION REQUISE:');
    console.log('Mettez à jour ADMIN_PASSWORD_HASH dans votre fichier .env:');
    console.log(`\nADMIN_PASSWORD_HASH=${newPasswordHash}\n`);
    console.log('Puis redémarrez le serveur pour appliquer le changement de façon permanente.\n');

    return ResponseHandler.success(
      res,
      'Mot de passe modifié avec succès. IMPORTANT: Mettez à jour votre fichier .env avec le nouveau hash.'
    );

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    return ResponseHandler.error(
      res,
      'Erreur lors du changement de mot de passe',
      500
    );
  }
};

// ==========================================
// VALIDATION MOT DE PASSE
// ==========================================

/**
 * Valider la force du nouveau mot de passe
 */
const validateNewPassword = (password) => {
  if (password.length < 8) {
    return { 
      valid: false, 
      error: 'Le mot de passe doit contenir au moins 8 caractères' 
    };
  }

  if (!/[A-Z]/.test(password)) {
    return { 
      valid: false, 
      error: 'Le mot de passe doit contenir au moins une majuscule' 
    };
  }

  if (!/[a-z]/.test(password)) {
    return { 
      valid: false, 
      error: 'Le mot de passe doit contenir au moins une minuscule' 
    };
  }

  if (!/[0-9]/.test(password)) {
    return { 
      valid: false, 
      error: 'Le mot de passe doit contenir au moins un chiffre' 
    };
  }

  if (!/[@$!%*?&#]/.test(password)) {
    return { 
      valid: false, 
      error: 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&#)' 
    };
  }

  return { valid: true };
};