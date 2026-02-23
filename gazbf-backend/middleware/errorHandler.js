// ==========================================
// FICHIER: middleware/errorHandler.js
// ==========================================
const ResponseHandler = require('../utils/responseHandler');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);

  // Erreur Sequelize - Validation
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return ResponseHandler.validationError(res, errors);
  }

  // Erreur Sequelize - Contrainte unique
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    return ResponseHandler.error(
      res,
      `Cette valeur pour ${field} existe déjà`,
      409
    );
  }

  // Erreur Sequelize - Clé étrangère
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ResponseHandler.error(
      res,
      'Référence invalide',
      400
    );
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return ResponseHandler.error(
      res,
      'Token invalide',
      401
    );
  }

  if (err.name === 'TokenExpiredError') {
    return ResponseHandler.error(
      res,
      'Token expiré',
      401
    );
  }

  // Erreur générique
  return ResponseHandler.error(
    res,
    err.message || 'Erreur serveur',
    err.statusCode || 500
  );
};

module.exports = errorHandler;