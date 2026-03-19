// ==========================================
// FICHIER: controllers/adminAuthController.js
// ✅ VERSION FINALE — Admin stocké en BDD (table users, role='admin')
//    Plus aucun hardcoding dans .env
// ==========================================

const jwt   = require('jsonwebtoken');
const db    = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// ==========================================
// HELPER : formater les données admin (sans champs sensibles)
// ==========================================
const formatAdmin = (admin) => ({
  id:        admin.id,
  email:     admin.email,
  firstName: admin.firstName,
  lastName:  admin.lastName,
  role:      admin.role,
  createdAt: admin.createdAt
});

// ==========================================
// VALIDATION DU NOUVEAU MOT DE PASSE
// ==========================================
const validateNewPassword = (password) => {
  if (password.length < 8)
    return { valid: false, error: 'Minimum 8 caractères requis' };
  if (!/[A-Z]/.test(password))
    return { valid: false, error: 'Au moins une majuscule requise' };
  if (!/[a-z]/.test(password))
    return { valid: false, error: 'Au moins une minuscule requise' };
  if (!/[0-9]/.test(password))
    return { valid: false, error: 'Au moins un chiffre requis' };
  if (!/[@$!%*?&#]/.test(password))
    return { valid: false, error: 'Au moins un caractère spécial (@$!%*?&#) requis' };
  return { valid: true };
};

// ==========================================
// LOGIN ADMIN
// @route   POST /api/admin/auth/login
// @access  Public
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return ResponseHandler.error(res, 'Email et mot de passe requis', 400);
    }

    // Rechercher l'admin en BDD
    const admin = await db.User.findOne({
      where: { email, role: 'admin' }
    });

    // Message générique — évite l'énumération de comptes
    if (!admin) {
      return ResponseHandler.error(res, 'Identifiants incorrects', 401);
    }

    if (!admin.isActive) {
      return ResponseHandler.error(res, 'Compte administrateur désactivé', 403);
    }

    // Vérifier le mot de passe via la méthode du modèle User
    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      return ResponseHandler.error(res, 'Identifiants incorrects', 401);
    }

    // Générer le JWT avec issuer/audience spécifiques à l'admin
    const token = jwt.sign(
      { id: admin.id, role: admin.role, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h', issuer: 'fasogaz-admin', audience: 'admin-panel' }
    );

    console.log('✅ Login admin réussi:', { email: admin.email, ip: req.ip });

    return ResponseHandler.success(
      res,
      'Connexion admin réussie',
      { token, admin: formatAdmin(admin) }
    );

  } catch (error) {
    console.error('❌ Erreur login admin:', error);
    return ResponseHandler.error(res, 'Erreur lors de la connexion', 500);
  }
};

// ==========================================
// PROFIL ADMIN
// @route   GET /api/admin/auth/profile
// @access  Private (Admin)
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    const admin = await db.User.findOne({
      where: { id: req.user.id, role: 'admin' },
      attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
    });

    if (!admin) {
      return ResponseHandler.error(res, 'Admin non trouvé', 404);
    }

    return ResponseHandler.success(res, 'Profil admin récupéré', formatAdmin(admin));

  } catch (error) {
    console.error('❌ Erreur profil admin:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération du profil', 500);
  }
};

// ==========================================
// CHANGEMENT MOT DE PASSE ADMIN
// ✅ Persisté en BDD via update — survit aux redémarrages
// @route   PUT /api/admin/auth/change-password
// @access  Private (Admin)
// ==========================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ResponseHandler.error(res, 'Mots de passe requis', 400);
    }

    // Récupérer l'admin avec le mot de passe pour pouvoir le comparer
    const admin = await db.User.findOne({
      where: { id: req.user.id, role: 'admin' }
    });

    if (!admin) {
      return ResponseHandler.error(res, 'Admin non trouvé', 404);
    }

    // Vérifier le mot de passe actuel
    const isCurrentValid = await admin.comparePassword(currentPassword);
    if (!isCurrentValid) {
      return ResponseHandler.error(res, 'Mot de passe actuel incorrect', 401);
    }

    // Valider la force du nouveau mot de passe
    const validation = validateNewPassword(newPassword);
    if (!validation.valid) {
      return ResponseHandler.error(res, validation.error, 400);
    }

    // Vérifier que le nouveau est différent de l'actuel
    const isSame = await admin.comparePassword(newPassword);
    if (isSame) {
      return ResponseHandler.error(
        res, 'Le nouveau mot de passe doit être différent de l\'ancien', 400
      );
    }

    // ✅ Mise à jour en BDD
    // Le hook beforeUpdate du modèle User hashera automatiquement le mot de passe
    await admin.update({ password: newPassword });

    console.log('✅ Mot de passe admin changé et persisté en BDD');

    return ResponseHandler.success(res, 'Mot de passe modifié avec succès.');

  } catch (error) {
    console.error('❌ Erreur changement mot de passe admin:', error);
    return ResponseHandler.error(res, 'Erreur lors du changement de mot de passe', 500);
  }
};