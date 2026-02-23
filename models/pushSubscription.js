module.exports = (sequelize, DataTypes) => {
  const PushSubscription = sequelize.define('PushSubscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },

    // ✅ endpoint corrigé
    endpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },

    // ✅ corrigé aussi
    p256dh: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    // ✅ corrigé aussi
    auth: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

  }, {
    tableName: 'push_subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isActive'] }
      // ❌ supprime l’index endpoint ici car unique: true le crée déjà
    ],
  });

  PushSubscription.associate = (models) => {
    PushSubscription.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return PushSubscription;
};