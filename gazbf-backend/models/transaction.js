// ==========================================
// FICHIER: models/transaction.js
// ==========================================
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
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
    transactionRef: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('subscription', 'refund'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('orange_money', 'moov_money', 'telecel_money'),
      allowNull: false
    },
    paymentPhone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    externalRef: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Référence du fournisseur de paiement'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    hooks: {
      beforeCreate: (transaction) => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        transaction.transactionRef = `TXN${timestamp}${random}`;
      }
    }
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Transaction;
};
