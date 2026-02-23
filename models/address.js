// ==========================================
// FICHIER: models/address.js
// Modèle d'adresse sans champ quartier
// ==========================================

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Ex: Maison, Bureau, Autre'
    },
    fullAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Adresse complète générée automatiquement'
    },
    city: {
      type: DataTypes.ENUM('Ouagadougou', 'Bobo-Dioulasso'),
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: 'Coordonnée GPS obligatoire'
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: 'Coordonnée GPS obligatoire'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    additionalInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Indications supplémentaires (point de repère, instructions)'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'addresses',
    timestamps: true
  });

  Address.associate = (models) => {
    Address.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    Address.hasMany(models.Order, {
      foreignKey: 'deliveryAddressId',
      as: 'orders'
    });
  };

  return Address;
};