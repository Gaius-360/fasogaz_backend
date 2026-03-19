// ==========================================
// FICHIER: models/order.js
// ✅ MODIFIÉ: Suppression du mode pickup
//            deliveryMode = 'delivery' uniquement
//            Suppression estimatedTime (non pertinent)
// ==========================================
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    deliveryAddressId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id'
      }
    },
    // ✅ MODIFIÉ: plus d'ENUM pickup/delivery, uniquement 'delivery'
    deliveryMode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'delivery'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    // ✅ MODIFIÉ: flux pending → accepted → in_delivery → completed
    status: {
      type: DataTypes.ENUM(
        'pending',
        'accepted',
        'in_delivery',
        'completed',
        'cancelled',
        'rejected',
        'expired'
      ),
      defaultValue: 'pending'
    },
    customerNote: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // ✅ SUPPRIMÉ: estimatedTime (non pertinent sans retrait sur place)
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Expiration automatique si le revendeur ne répond pas (24h)'
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    hooks: {
      beforeValidate: async (order) => {
        if (!order.orderNumber) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          order.orderNumber = `CMD${timestamp}${random}`;
        }

        // Définir la date d'expiration (24h après création)
        if (!order.expiresAt && order.isNewRecord) {
          const expirationDate = new Date();
          expirationDate.setHours(expirationDate.getHours() + 24);
          order.expiresAt = expirationDate;
        }

        // Forcer deliveryMode à 'delivery'
        order.deliveryMode = 'delivery';
      }
    }
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, {
      foreignKey: 'customerId',
      as: 'customer'
    });

    Order.belongsTo(models.User, {
      foreignKey: 'sellerId',
      as: 'seller'
    });

    Order.belongsTo(models.Address, {
      foreignKey: 'deliveryAddressId',
      as: 'deliveryAddress'
    });

    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'items'
    });

    Order.hasOne(models.Review, {
      foreignKey: 'orderId',
      as: 'review'
    });
  };

  return Order;
};