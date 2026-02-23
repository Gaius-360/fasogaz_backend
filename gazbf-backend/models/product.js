// ==========================================
// FICHIER: models/product.js (MIS À JOUR)
// Avec notification automatique de stock
// ==========================================
const NotificationService = require('../utils/notificationService');

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
      type: DataTypes.ENUM('3kg', '6kg', '12kg'),
      allowNull: false
    },
    brand: {
      type: DataTypes.ENUM('Shell Gaz', 'Total', 'Oryx', 'Sodigaz', 'PeGaz'),
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
      type: DataTypes.BIGINT,
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
      beforeSave: async (product) => {
        // Sauvegarder la quantité précédente pour comparaison
        if (product._previousDataValues && product._previousDataValues.quantity !== undefined) {
          product._previousQuantity = product._previousDataValues.quantity;
        }

        // Mise à jour automatique du statut selon la quantité
        if (product.quantity === 0) {
          product.status = 'out_of_stock';
        } else if (product.quantity <= 5) {
          product.status = 'limited';
        } else {
          product.status = 'available';
        }
      },
      afterSave: async (product) => {
        // Vérifier si la quantité a changé
        const previousQuantity = product._previousQuantity !== undefined 
          ? product._previousQuantity 
          : product.quantity;

        // Si la quantité a diminué ET atteint un seuil critique
        if (previousQuantity > product.quantity && product.quantity <= 5) {
          // Envoyer notification de stock faible/rupture
          await NotificationService.notifyStockAlert(product, previousQuantity);
        }

        // Nettoyer la variable temporaire
        delete product._previousQuantity;
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
  };

  return Product;
};