// ==========================================
// FICHIER: models/product.js
// ==========================================
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    bottleType: {
      type: DataTypes.ENUM('6kg', '12kg', '25kg', '38kg'),
      allowNull: false
    },
    brand: {
      type: DataTypes.ENUM('Shell Gas', 'Total Gas', 'Vitogaz', 'Oryx Energies', 'Afrigas', 'Gazlam'),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'limited', 'out_of_stock'),
      defaultValue: 'available'
    },
    productImage: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    orderCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'products',
    timestamps: true,
    hooks: {
      beforeSave: (product) => {
        // Mise à jour automatique du statut selon la quantité
        if (product.quantity === 0) {
          product.status = 'out_of_stock';
        } else if (product.quantity <= 5) {
          product.status = 'limited';
        } else {
          product.status = 'available';
        }
      }
    }
  });

  Product.associate = (models) => {
    Product.belongsTo(models.User, {
      foreignKey: 'sellerId',
      as: 'seller'
    });

    Product.hasMany(models.OrderItem, {
      foreignKey: 'productId',
      as: 'orderItems'
    });

    Product.hasMany(models.Promotion, {
      foreignKey: 'productId',
      as: 'promotions'
    });
  };

  return Product;
};