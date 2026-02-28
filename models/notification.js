// ==========================================
// FICHIER: models/notification.js
// Modèle pour les notifications utilisateurs
// ==========================================

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Utilisateur qui reçoit la notification'
    },
    type: {
      type: DataTypes.ENUM(
        'new_order',
        'order_accepted',
        'order_rejected',
        'order_completed',
        'order_cancelled',
        'stock_alert',
        'subscription_expiring',
        'subscription_expired',
        'grace_period',
        'review_received',
        'system'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Titre de la notification'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Message de la notification'
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Données additionnelles (orderId, productId, etc.)'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Notification lue ou non'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de lecture'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      comment: 'Priorité de la notification'
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL vers laquelle rediriger l\'utilisateur'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date d\'expiration de la notification'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isRead'] },
      { fields: ['type'] },
      { fields: ['createdAt'] }
    ]
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        onDelete: 'CASCADE',  // ✅ Supprime automatiquement quand l'user est supprimé
        onUpdate: 'CASCADE'
      },
      as: 'user'
    });
  };

  return Notification;
};