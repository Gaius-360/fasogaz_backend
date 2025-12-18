// ==========================================
// FICHIER: models/address.js
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
      comment: 'Maison, Bureau, etc.'
    },
    city: {
      type: DataTypes.ENUM('Ouagadougou', 'Bobo-Dioulasso'),
      allowNull: false
    },
    quarter: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    fullAddress: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
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