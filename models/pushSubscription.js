// ==========================================
// FICHIER: models/PushSubscription.js
// ==========================================
module.exports = (sequelize, DataTypes) => {
  const PushSubscription = sequelize.define('PushSubscription', {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
    },

    userId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'users', key: 'id' },
      onDelete:   'CASCADE',
    },

    // ✅ FIX CRITIQUE : TEXT au lieu de STRING(500)
    // Les endpoints Apple Push Service (iOS) dépassent régulièrement 500 caractères.
    // STRING(500) tronque silencieusement => endpoint corrompu => push rejeté
    // en 404/410 => abonnement désactivé automatiquement côté pushService.js
    endpoint: {
      type:      DataTypes.TEXT,
      allowNull: false,
      unique:    true,
    },

    // ✅ FIX : TEXT pour p256dh et auth (les clés base64url peuvent varier en longueur)
    p256dh: {
      type:      DataTypes.TEXT,
      allowNull: false,
    },

    auth: {
      type:      DataTypes.TEXT,
      allowNull: false,
    },

    userAgent: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },

    lastUsedAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },

    isActive: {
      type:         DataTypes.BOOLEAN,
      defaultValue: true,
    },

  }, {
    tableName:  'push_subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isActive'] },
      // ✅ L'index unique sur endpoint est créé automatiquement par unique: true
    ],
  })

  PushSubscription.associate = (models) => {
    PushSubscription.belongsTo(models.User, {
      foreignKey: 'userId',
      as:         'user',
    })
  }

  return PushSubscription
}