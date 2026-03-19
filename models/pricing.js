// ==========================================
// FICHIER: models/pricing.js
// ✅ REFONTE: Plans d'abonnement pour clients ET revendeurs
//    - CLIENT : sans abonnement = 5 revendeurs max
//    - REVENDEUR : visibilité sur la carte
//    - Colonnes legacy conservées nullable pour migration sans downtime
// ==========================================

module.exports = (sequelize, DataTypes) => {
  const Pricing = sequelize.define('Pricing', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    targetRole: {
      type: DataTypes.ENUM('client', 'revendeur'),
      allowNull: false,
      unique: true
    },

    // ── Plans d'abonnement (client ET revendeur) ──────────────────────────
    plans: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        weekly:    { price: 0, duration: 7,   enabled: false },
        monthly:   { price: 0, duration: 30,  enabled: false },
        quarterly: { price: 0, duration: 90,  enabled: false },
        yearly:    { price: 0, duration: 365, enabled: false }
      },
      comment: 'Plans disponibles (client ET revendeur)'
    },

    // Jours gratuits à l'inscription (revendeur uniquement — toujours 0 pour client)
    freeTrialDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    // ── Config commune ────────────────────────────────────────────────────
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'false = accès gratuit illimité pour tous'
    },

    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    options: {
      type: DataTypes.JSON,
      defaultValue: {
        autoRenew:          true,
        gracePeriodDays:    3,
        notifyBeforeExpiry: 7
      }
    },

    // ── Colonnes legacy (conservées nullable — à supprimer après migration) ─
    accessPrice24h: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: '[DEPRECATED] Remplacé par plans'
    },

    accessDurationHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: '[DEPRECATED] Remplacé par plans'
    }

  }, {
    tableName: 'pricing',
    timestamps: true
  });

  // ── Méthodes statiques ──────────────────────────────────────────────────

  /** Config client : plans activés + limite sans abonnement */
  Pricing.getClientConfig = async function () {
    const config = await this.findOne({ where: { targetRole: 'client' } });
    if (!config || !config.isActive) {
      return { isActive: false, maxSellersWithoutSubscription: null, plans: {} };
    }
    const enabledPlans = Object.fromEntries(
      Object.entries(config.plans || {}).filter(([, p]) => p.enabled)
    );
    return {
      isActive: true,
      maxSellersWithoutSubscription: 5,
      plans: enabledPlans,
      options: config.options || {}
    };
  };

  /** Config revendeur : plans + période d'essai */
  Pricing.getSellerConfig = async function () {
    const config = await this.findOne({ where: { targetRole: 'revendeur' } });
    if (!config || !config.isActive) {
      return { isActive: false, freeTrialDays: 0, plans: {} };
    }
    return {
      isActive: true,
      freeTrialDays: config.freeTrialDays || 0,
      plans: config.plans || {},
      options: config.options || {}
    };
  };

  /** Prix minimum parmi les plans activés */
  Pricing.getCheapestPlan = function (plans) {
    const enabled = Object.values(plans || {}).filter(p => p.enabled);
    if (!enabled.length) return null;
    return enabled.reduce((min, p) => (p.price < min.price ? p : min), enabled[0]);
  };

  return Pricing;
};