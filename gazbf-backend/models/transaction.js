// ==========================================
// FICHIER: models/transaction.js
// Modèle unifié pour toutes les transactions
// ==========================================

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false
    },
    
    // Référence utilisateur
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Utilisateur qui a effectué la transaction'
    },
    
    // Type de transaction
    type: {
      type: DataTypes.ENUM(
        'seller_subscription',
        'client_access',
        'order_payment',
        'seller_subscription_renewal',
        'seller_early_renewal'
      ),
      allowNull: false,
      comment: 'Type de transaction'
    },
    
    // Informations financières
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Montant de la transaction en FCFA'
    },
    
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Commission prélevée par la plateforme'
    },
    
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Montant net après commission'
    },
    
    // Méthode de paiement
    paymentMethod: {
      type: DataTypes.ENUM(
        'orange_money',
        'moov_money',
        'coris_money',
        'wave',
        'cash',
        'ligdicash'
      ),
      allowNull: false,
      defaultValue: 'orange_money'
    },
    
    paymentPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Numéro de téléphone utilisé pour le paiement'
    },
    
    // Référence transaction interne
    transactionNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      defaultValue: () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `TXN-${timestamp}-${random}`;
      },
      comment: 'Numéro unique de transaction (TXN-XXXXXX)'
    },
    
    // Référence fournisseur externe (LigdiCash, etc.)
    externalTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de transaction du fournisseur de paiement'
    },

    // ================================
    // CHAMPS LIGDICASH (AJOUTÉS)
    // ================================

    ligdicashToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Token retourné par LigdiCash pour initier le paiement'
    },

    ligdicashOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Order ID retourné par LigdiCash'
    },

    isSimulation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indique si la transaction est une simulation (mode test)'
    },

    // Statut
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded'
      ),
      defaultValue: 'pending'
    },
    
    // Relations avec autres entités
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id'
      },
      comment: 'ID de l\'abonnement revendeur'
    },
    
    accessPurchaseId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'access_purchases',
        key: 'id'
      },
      comment: 'ID de l\'achat d\'accès client'
    },
    
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      },
      comment: 'ID de la commande'
    },
    
    // Description
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    
    // Dates importantes
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    failureReason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    
    // Traçabilité
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Validation admin
    validatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    validatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
    
  }, {
    tableName: 'transactions',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci',
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['transactionNumber'], unique: true },
      { fields: ['createdAt'] },
      { fields: ['subscriptionId'] },
      { fields: ['accessPurchaseId'] },
      { fields: ['orderId'] },
      { fields: ['ligdicashOrderId'] },
      { fields: ['ligdicashToken'] }
    ],
    hooks: {
      beforeValidate: (transaction) => {
        if (!transaction.id) {
          transaction.id = uuidv4();
        }
        
        if (!transaction.transactionNumber) {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8).toUpperCase();
          transaction.transactionNumber = `TXN-${timestamp}-${random}`;
        }
        
        if (transaction.platformFee && parseFloat(transaction.platformFee) > 0) {
          transaction.netAmount =
            parseFloat(transaction.amount) -
            parseFloat(transaction.platformFee);
        } else if (!transaction.netAmount) {
          transaction.netAmount = transaction.amount;
        }
      }
    }
  });

  // Méthodes d'instance
  Transaction.prototype.markAsCompleted = async function(adminId = null) {
    this.status = 'completed';
    this.completedAt = new Date();
    if (adminId) {
      this.validatedBy = adminId;
      this.validatedAt = new Date();
    }
    await this.save();
    return this;
  };

  Transaction.prototype.markAsFailed = async function(reason) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    await this.save();
    return this;
  };

  Transaction.prototype.canBeValidated = function() {
    return this.status === 'pending' || this.status === 'processing';
  };

  // Méthodes statiques
  Transaction.generateTransactionNumber = function() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  };

  // Associations
  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    Transaction.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription'
    });

    Transaction.belongsTo(models.AccessPurchase, {
      foreignKey: 'accessPurchaseId',
      as: 'accessPurchase'
    });

    Transaction.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });

    Transaction.belongsTo(models.User, {
      foreignKey: 'validatedBy',
      as: 'validator'
    });
  };

  return Transaction;
};
