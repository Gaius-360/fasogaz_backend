const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        is: /^\+226[0-9]{8}$/ // Format burkinabé
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.ENUM('client', 'revendeur', 'admin'),
      defaultValue: 'client',
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    city: {
      type: DataTypes.ENUM('Ouagadougou', 'Bobo-Dioulasso'),
      allowNull: true
    },
    // Champs spécifiques revendeurs
    businessName: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    businessDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quarter: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    businessPhoto: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    openingHours: {
      type: DataTypes.JSON,
      allowNull: true
    },
    deliveryAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deliveryRadius: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Rayon de livraison en km'
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    validationStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Méthode pour vérifier le mot de passe
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Associations
  User.associate = (models) => {
    // Un client peut avoir plusieurs adresses
    User.hasMany(models.Address, {
      foreignKey: 'userId',
      as: 'addresses'
    });

    // Un revendeur peut avoir plusieurs produits
    User.hasMany(models.Product, {
      foreignKey: 'sellerId',
      as: 'products'
    });

    // Un client peut avoir plusieurs commandes
    User.hasMany(models.Order, {
      foreignKey: 'customerId',
      as: 'ordersAsCustomer'
    });

    // Un revendeur reçoit plusieurs commandes
    User.hasMany(models.Order, {
      foreignKey: 'sellerId',
      as: 'ordersAsSeller'
    });

    // Abonnement
    User.hasOne(models.Subscription, {
      foreignKey: 'userId',
      as: 'subscription'
    });

    // Avis reçus (pour revendeurs)
    User.hasMany(models.Review, {
      foreignKey: 'sellerId',
      as: 'reviewsReceived'
    });

    // Avis donnés (pour clients)
    User.hasMany(models.Review, {
      foreignKey: 'customerId',
      as: 'reviewsGiven'
    });

    // Transactions
    User.hasMany(models.Transaction, {
      foreignKey: 'userId',
      as: 'transactions'
    });

    // Favoris
    User.belongsToMany(models.User, {
      through: 'Favorites',
      as: 'favoriteSellers',
      foreignKey: 'customerId',
      otherKey: 'sellerId'
    });
  };

  return User;
};
