// ==========================================
// FICHIER: models/promotion.js
// ==========================================
module.exports = (sequelize, DataTypes) => {
  const Promotion = sequelize.define('Promotion', {
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
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('product_discount', 'flash_sale', 'bundle', 'happy_hour'),
      allowNull: false
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    discountPercent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    stockAllocated: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    stockSold: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'promotions',
    timestamps: true
  });

  Promotion.associate = (models) => {
    Promotion.belongsTo(models.User, {
      foreignKey: 'sellerId',
      as: 'seller'
    });

    Promotion.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return Promotion;
};