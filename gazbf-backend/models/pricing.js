// ==========================================
// FICHIER: models/pricing.js (VERSION MISE À JOUR)
// Modèle Pricing avec système d'accès 24h pour clients
// ==========================================

module.exports = (sequelize, DataTypes) => {
  const Pricing = sequelize.define('Pricing', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Type de cible (client ou revendeur)
    targetRole: {
      type: DataTypes.ENUM('client', 'revendeur'),
      allowNull: false,
      unique: true
    },
    
    // ==========================================
    // CONFIGURATION CLIENT (PAY-PER-ACCESS)
    // ==========================================
    
    // Prix de l'accès 24h (pour clients)
    accessPrice24h: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: '[CLIENT] Prix pour accès 24h'
    },
    
    // Durée de l'accès en heures (pour clients)
    accessDurationHours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      comment: '[CLIENT] Durée de l\'accès en heures'
    },
    
    // ==========================================
    // CONFIGURATION REVENDEUR (ABONNEMENT)
    // ==========================================
    
    // Plans disponibles avec leurs prix (pour revendeurs)
    plans: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        weekly: { price: 0, duration: 7, enabled: false },
        monthly: { price: 0, duration: 30, enabled: false },
        quarterly: { price: 0, duration: 90, enabled: false },
        yearly: { price: 0, duration: 365, enabled: false }
      },
      comment: '[REVENDEUR] Plans d\'abonnement disponibles'
    },
    
    // Jours gratuits pour nouveaux utilisateurs (pour revendeurs)
    freeTrialDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '[REVENDEUR] Jours gratuits à l\'inscription'
    },
    
    // ==========================================
    // CONFIGURATION COMMUNE
    // ==========================================
    
    // Système activé ou non
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si false, accès gratuit illimité pour tous'
    },
    
    // Date d'activation du système de tarification
    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de première activation de la tarification'
    },
    
    // Options supplémentaires
    options: {
      type: DataTypes.JSON,
      defaultValue: {
        // Pour revendeurs
        autoRenew: true,
        gracePeriodDays: 3,
        notifyBeforeExpiry: 7,
        // Pour clients
        allowMultiplePurchases: true,
        maxPurchasesPerDay: 10,
        notifyBeforeAccessExpiry: 2 // en heures
      }
    }
  }, {
    tableName: 'pricing',
    timestamps: true
  });

  // Méthode pour obtenir le prix d'accès client
  Pricing.getClientAccessPrice = async function() {
    const config = await this.findOne({ 
      where: { targetRole: 'client' } 
    });
    
    if (!config || !config.isActive) {
      return {
        isActive: false,
        price: 0,
        duration: 24,
        message: 'Accès gratuit'
      };
    }
    
    return {
      isActive: true,
      price: parseFloat(config.accessPrice24h),
      duration: config.accessDurationHours,
      options: config.options
    };
  };

  // Méthode pour obtenir la config revendeur
  Pricing.getSellerConfig = async function() {
    const config = await this.findOne({ 
      where: { targetRole: 'revendeur' } 
    });
    
    if (!config || !config.isActive) {
      return {
        isActive: false,
        freeTrialDays: 0,
        plans: {}
      };
    }
    
    return {
      isActive: true,
      freeTrialDays: config.freeTrialDays,
      plans: config.plans,
      options: config.options
    };
  };

  return Pricing;
};