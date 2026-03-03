// ==========================================
// FICHIER: models/user.js (VERSION COMPLÈTE AVEC AGENTS)
// Modèle User avec système d'accès 24h + Agents terrain
// ==========================================

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
        is: /^\+226[0-9]{8}$/
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
        isEmail: { msg: 'Format email invalide' },
        notEmpty: false
      },
      set(value) {
        if (value === '' || value === null || value === undefined) {
          this.setDataValue('email', null);
        } else {
          this.setDataValue('email', value);
        }
      }
    },
    role: {
      type: DataTypes.ENUM('client', 'revendeur', 'admin', 'agent'),  // ← AJOUT 'agent'
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
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    city: {
      type: DataTypes.ENUM('Ouagadougou', 'Bobo-Dioulasso'),
      allowNull: true
    },

    // ==========================================
    // CHAMPS REVENDEURS
    // ==========================================
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
      defaultValue: 0
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
    },
    
    // ==========================================
    // SYSTÈME D'ACCÈS 24H (CLIENTS)
    // ==========================================
    lastAccessPurchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date du dernier achat d\'accès 24h'
    },
    accessExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date d\'expiration de l\'accès actuel'
    },
    hasActiveAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'A un accès actif (dans les 24h)'
    },
    totalAccessPurchases: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Nombre total d\'achats d\'accès'
    },

    // ==========================================
    // ABONNEMENT REVENDEURS
    // ==========================================
    freeTrialStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '[REVENDEUR] Date début période essai'
    },
    freeTrialEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '[REVENDEUR] Date fin période essai'
    },
    hasUsedFreeTrial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '[REVENDEUR] A utilisé la période gratuite'
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '[REVENDEUR] Date fin abonnement payant'
    },
    hasActiveSubscription: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '[REVENDEUR] Abonnement payant actif'
    },
    gracePeriodEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '[REVENDEUR] Date fin période de grâce'
    },

    // ==========================================
    // ✅ NOUVEAUX CHAMPS AGENTS TERRAIN
    // ==========================================
    agentCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        is: {
          args: /^AG-[A-Z0-9]{8}$/i,
          msg: 'Format du code agent invalide (doit être AG-XXXXXXXX)'
        }
      },
      comment: 'Code unique de l\'agent (format: AG-XXXXXXXX)'
    },
    
    agentZone: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Zone d\'affectation de l\'agent (ex: Ouagadougou Centre)'
    },
    
    isAgentActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Statut actif/inactif de l\'agent terrain'
    },
    
    agentStats: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Statistiques de l\'agent: { totalInvitationsSent, totalSellersRecruited, lastInvitationDate }'
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
    },
    // ✅ AJOUT D'INDEX POUR LES AGENTS
    indexes: [
      {
        unique: true,
        fields: ['phone']
      },
      {
        unique: true,
        fields: ['agentCode'],
        name: 'idx_users_agentCode'
      },
      {
        fields: ['role', 'isAgentActive'],
        name: 'idx_users_role_agentActive'
      }
    ]
  });

  // Méthode vérification mot de passe
  User.prototype.comparePassword = async function(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      console.error('❌ Erreur comparePassword:', error);
      return false;
    }
  };

  // Vérifier si l'accès est actif
  User.prototype.hasValidAccess = function() {
    if (this.role !== 'client') return true;
    
    if (!this.hasActiveAccess || !this.accessExpiryDate) {
      return false;
    }
    
    return new Date() < new Date(this.accessExpiryDate);
  };

  // Activer l'accès 24h
  User.prototype.activateAccess = async function(durationHours = 24) {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    
    this.lastAccessPurchaseDate = now;
    this.accessExpiryDate = expiryDate;
    this.hasActiveAccess = true;
    this.totalAccessPurchases = (this.totalAccessPurchases || 0) + 1;
    
    await this.save();
    
    return {
      activatedAt: now,
      expiresAt: expiryDate,
      durationHours
    };
  };

  // ✅ NOUVELLE MÉTHODE : Vérifier si c'est un agent actif
  User.prototype.isActiveAgent = function() {
    return this.role === 'agent' && this.isAgentActive && this.isActive;
  };

  // ✅ NOUVELLE MÉTHODE : Mettre à jour les stats agent
  User.prototype.updateAgentStats = async function(updates) {
    if (this.role !== 'agent') {
      throw new Error('Cette méthode est réservée aux agents');
    }
    
    const currentStats = this.agentStats || {
      totalInvitationsSent: 0,
      totalSellersRecruited: 0,
      lastInvitationDate: null
    };
    
    this.agentStats = {
      ...currentStats,
      ...updates
    };
    
    await this.save();
    return this.agentStats;
  };

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Address, {
      foreignKey: 'userId',
      as: 'addresses'
    });

    User.hasMany(models.Product, {
      foreignKey: 'sellerId',
      as: 'products'
    });

    User.hasMany(models.Order, {
      foreignKey: 'customerId',
      as: 'ordersAsCustomer'
    });

    User.hasMany(models.Order, {
      foreignKey: 'sellerId',
      as: 'ordersAsSeller'
    });

    User.hasOne(models.Subscription, {
      foreignKey: 'userId',
      as: 'subscription'
    });

    User.hasMany(models.Review, {
      foreignKey: 'sellerId',
      as: 'reviewsReceived'
    });

    User.hasMany(models.Review, {
      foreignKey: 'customerId',
      as: 'reviewsGiven'
    });

    User.hasMany(models.Transaction, {
      foreignKey: 'userId',
      as: 'transactions'
    });

    User.hasMany(models.AccessPurchase, {
      foreignKey: 'userId',
      as: 'accessPurchases'
    });

    User.belongsToMany(models.User, {
      through: 'Favorites',
      as: 'favoriteSellers',
      foreignKey: 'customerId',
      otherKey: 'sellerId'
    });

    // ✅ NOUVELLE ASSOCIATION : Invitations générées par l'agent
    User.hasMany(models.InvitationToken, {
      foreignKey: 'generatedBy',
      as: 'generatedInvitations'
    });
  };

  return User;
};