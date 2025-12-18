// ==========================================
// FICHIER: models/order.js
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
    deliveryMode: {
      type: DataTypes.ENUM('pickup', 'delivery'),
      allowNull: false
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
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'in_delivery', 'completed', 'cancelled', 'rejected'),
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
    estimatedTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Temps estimé en minutes'
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
      beforeCreate: async (order) => {
        // Générer un numéro de commande unique
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        order.orderNumber = `CMD${timestamp}${random}`;
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