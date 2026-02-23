// ==========================================
// FICHIER: models/adminWithdrawal.js
// Modèle pour les demandes de retrait administrateur
// ==========================================

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const AdminWithdrawal = sequelize.define('AdminWithdrawal', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false
    },
    
    // Montant
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Montant du retrait en FCFA'
    },
    
    // Frais de retrait (optionnel)
    fees: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 1000.00,
      comment: 'Frais de retrait en FCFA'
    },
    
    // Montant net à recevoir
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Montant net après frais'
    },
    
    // Méthode de retrait
    paymentMethod: {
      type: DataTypes.ENUM(
        'orange_money',
        'moov_money'
      ),
      allowNull: false,
      defaultValue: 'orange_money'
    },
    
    // Détails du compte
    accountDetails: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Détails du compte (phone, accountName, etc.)'
    },
    
    // Statut
    status: {
      type: DataTypes.ENUM(
        'pending',      // En attente
        'processing',   // En traitement
        'completed',    // Complété
        'failed',       // Échoué
        'cancelled'     // Annulé
      ),
      defaultValue: 'pending'
    },
    
    // Qui a demandé le retrait
    requestedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin qui a demandé le retrait'
    },
    
    // Dates
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Date de la demande'
    },
    
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de traitement'
    },
    
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de complétion'
    },
    
    // Qui a traité
    processedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Qui a traité le retrait (admin ou système)'
    },
    
    // Raison d'échec/annulation
    failureReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Raison de l\'échec ou annulation'
    },
    
    // Référence transaction externe
    externalTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de transaction du fournisseur de paiement'
    },
    
    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes additionnelles'
    }
    
  }, {
    tableName: 'admin_withdrawals',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci',
    underscored: false,
    indexes: [
      { fields: ['requestedBy'] },
      { fields: ['status'] },
      { fields: ['requestedAt'] },
      { fields: ['processedBy'] }
    ],
    hooks: {
      beforeCreate: (withdrawal) => {
        if (!withdrawal.id) {
          withdrawal.id = uuidv4();
        }
        
        // Calculer le montant net
        const amount = parseFloat(withdrawal.amount);
        const fees = parseFloat(withdrawal.fees || 0);
        withdrawal.netAmount = amount - fees;
      }
    }
  });

  // Méthodes d'instance
  AdminWithdrawal.prototype.markAsProcessing = async function(processedById = null) {
    this.status = 'processing';
    this.processedAt = new Date();
    if (processedById) {
      this.processedBy = processedById;
    }
    await this.save();
    return this;
  };

  AdminWithdrawal.prototype.markAsCompleted = async function(processedById = null, externalTxId = null) {
    this.status = 'completed';
    this.completedAt = new Date();
    if (processedById) {
      this.processedBy = processedById;
    }
    if (externalTxId) {
      this.externalTransactionId = externalTxId;
    }
    await this.save();
    return this;
  };

  AdminWithdrawal.prototype.markAsFailed = async function(reason) {
    this.status = 'failed';
    this.failureReason = reason;
    this.processedAt = new Date();
    await this.save();
    return this;
  };

  AdminWithdrawal.prototype.cancel = async function(reason) {
    this.status = 'cancelled';
    this.failureReason = reason;
    await this.save();
    return this;
  };

  AdminWithdrawal.prototype.canBeProcessed = function() {
    return this.status === 'pending';
  };

  // Associations
  AdminWithdrawal.associate = (models) => {
    AdminWithdrawal.belongsTo(models.User, {
      foreignKey: 'requestedBy',
      as: 'requestedByUser'
    });

    AdminWithdrawal.belongsTo(models.User, {
      foreignKey: 'processedBy',
      as: 'processedByUser'
    });
  };

  return AdminWithdrawal;
};