// ==========================================
// FICHIER: models/subscription.js (VERSION CORRIGÉE)
// Modèle pour les abonnements avec champ hasEarlyRenewal
// ==========================================

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'userId'
    },
    planType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'planType'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'amount'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'startDate'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'endDate'
    },
    paymentMethod: {
      type: DataTypes.ENUM('orange_money', 'moov_money', 'coris_money', 'wave', 'cash', 'ligdicash'),
      allowNull: false,
      defaultValue: 'orange_money',
      field: 'paymentMethod'
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'transactionId'
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'expired', 'cancelled', 'deleted'),
      defaultValue: 'pending',
      field: 'status'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'isActive'
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'autoRenew'
    },
    // ✅ NOUVEAU : Indicateur de renouvellement anticipé
    hasEarlyRenewal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'hasEarlyRenewal',
      comment: 'Indique si un renouvellement anticipé a déjà été effectué'
    },
    // ✅ NOUVEAU : Montant initial (avant renouvellement anticipé)
    initialAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'initialAmount',
      comment: 'Montant initial avant renouvellement anticipé'
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci',
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: (subscription) => {
        if (!subscription.id) {
          subscription.id = uuidv4();
        }
        // Sauvegarder le montant initial
        if (!subscription.initialAmount) {
          subscription.initialAmount = subscription.amount;
        }
      }
    }
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Subscription;
};