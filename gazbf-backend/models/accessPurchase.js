// ==========================================
// FICHIER: models/accessPurchase.js
// Modèle pour l'historique des achats d'accès 24h
// ==========================================

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const AccessPurchase = sequelize.define('AccessPurchase', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Montant payé pour l\'accès 24h'
    },
    durationHours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      comment: 'Durée de l\'accès en heures'
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Date et heure d\'achat'
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date et heure d\'expiration'
    },
    paymentMethod: {
      type: DataTypes.ENUM('orange_money', 'moov_money', 'coris_money', 'wave', 'cash', 'ligdicash'),
      allowNull: false,
      defaultValue: 'orange_money'
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de transaction du paiement mobile'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'expired'),
      defaultValue: 'pending',
      comment: 'Statut du paiement et de l\'accès'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'L\'accès est-il encore actif'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Adresse IP lors de l\'achat'
    },
    deviceInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Informations sur l\'appareil'
    }
  }, {
    tableName: 'access_purchases',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci',
    underscored: false,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['purchaseDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expiryDate']
      }
    ],
    hooks: {
      beforeCreate: (accessPurchase) => {
        if (!accessPurchase.id) {
          accessPurchase.id = uuidv4();
        }
        if (!accessPurchase.expiryDate && accessPurchase.purchaseDate) {
          const expiry = new Date(accessPurchase.purchaseDate);
          expiry.setHours(expiry.getHours() + (accessPurchase.durationHours || 24));
          accessPurchase.expiryDate = expiry;
        }
      }
    }
  });

  // Méthode pour vérifier si l'accès est encore valide
  AccessPurchase.prototype.isValid = function() {
    return this.status === 'completed' && 
           this.isActive && 
           new Date() < new Date(this.expiryDate);
  };

  // Méthode pour calculer le temps restant en minutes
  AccessPurchase.prototype.getRemainingMinutes = function() {
    if (!this.isValid()) return 0;
    const now = new Date();
    const expiry = new Date(this.expiryDate);
    const diffMs = expiry - now;
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Associations
  AccessPurchase.associate = (models) => {
    AccessPurchase.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return AccessPurchase;
};