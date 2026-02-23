// ==========================================
// FICHIER: models/review.js - AVEC LIMITE 2 AVIS MAX
// ==========================================

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
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
    productId: {
      type: DataTypes.UUID,
      allowNull: true, // Null pour avis général
      references: {
        model: 'products',
        key: 'id'
      }
    },
    reviewType: {
      type: DataTypes.ENUM('service', 'product'),
      allowNull: false,
      defaultValue: 'service',
      comment: 'Type d\'avis: service global ou produit spécifique'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sellerResponse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      // Index pour empêcher les doublons par type
      {
        unique: true,
        fields: ['orderId', 'reviewType'],
        name: 'unique_order_review_type'
      },
      // Index pour les recherches
      {
        fields: ['sellerId', 'createdAt']
      },
      {
        fields: ['customerId', 'createdAt']
      },
      {
        fields: ['productId']
      }
    ]
  });

  Review.associate = (models) => {
    Review.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });

    Review.belongsTo(models.User, {
      foreignKey: 'customerId',
      as: 'customer'
    });

    Review.belongsTo(models.User, {
      foreignKey: 'sellerId',
      as: 'seller'
    });

    Review.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return Review;
};