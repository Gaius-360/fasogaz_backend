// ==========================================
// FICHIER: models/SystemSettings.js
// Modèle pour les paramètres système
// ==========================================

module.exports = (sequelize, DataTypes) => {
  const SystemSettings = sequelize.define('SystemSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    platformName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'FasoGaz'
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1.0'
    },
    supportPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    supportEmail: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    validationDelay: {
      type: DataTypes.INTEGER,
      defaultValue: 48,
      comment: 'Délai de traitement en heures'
    },
    autoValidation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    maintenanceMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    maintenanceMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'system_settings',
    timestamps: true
  });

  return SystemSettings;
};