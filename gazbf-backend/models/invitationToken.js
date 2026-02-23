// ==========================================
// FICHIER: models/invitationToken.js
// Modèle pour gérer les liens d'invitation sécurisés
// ✅ CORRIGÉ - Support admin hardcodé avec generatedBy nullable
// ==========================================

module.exports = (sequelize, DataTypes) => {
  const InvitationToken = sequelize.define('InvitationToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Token unique et sécurisé
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: 'Token unique généré pour le lien d\'invitation'
    },
    
    // Qui a généré le lien
    // ✅ CORRECTION: allowNull true pour supporter l'admin hardcodé
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: true, // ← NULL pour admin hardcodé
      comment: 'ID de l\'admin ou agent qui a généré le lien (NULL si admin hardcodé)'
    },
    
    // Type de générateur
    generatorType: {
      type: DataTypes.ENUM('admin', 'agent'),
      allowNull: false,
      comment: 'Type de compte qui a généré le lien'
    },
    
    // Statut du token
    status: {
      type: DataTypes.ENUM('active', 'used', 'expired', 'revoked'),
      defaultValue: 'active',
      allowNull: false
    },
    
    // Dates importantes
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date d\'expiration du lien'
    },
    
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date d\'utilisation du lien'
    },
    
    // Informations sur l'utilisation
    usedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID du revendeur qui s\'est inscrit avec ce lien'
    },
    
    usedByPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Téléphone du revendeur (pour traçabilité)'
    },
    
    // Métadonnées
    // ✅ Stocke les infos de l'admin hardcodé si applicable
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'Données supplémentaires (localisation, notes, generatorUsername pour admin hardcodé)'
    },
    
    // Note ou raison de création
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes de l\'agent/admin lors de la génération'
    },
    
    // Raison de révocation (si applicable)
    revokedReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // ✅ CORRECTION: nullable aussi pour le revokedBy
    revokedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de qui a révoqué (NULL si admin hardcodé)'
    }
  }, {
    tableName: 'invitation_tokens',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['token'] },
      { fields: ['generatedBy'] }, // Index même si nullable
      { fields: ['status'] },
      { fields: ['expiresAt'] },
      { fields: ['usedBy'] }
    ]
  });

  // Méthodes d'instance
  InvitationToken.prototype.isValid = function() {
    return (
      this.status === 'active' &&
      new Date() < new Date(this.expiresAt)
    );
  };

  InvitationToken.prototype.markAsUsed = async function(userId, userPhone) {
    this.status = 'used';
    this.usedAt = new Date();
    this.usedBy = userId;
    this.usedByPhone = userPhone;
    await this.save();
  };

  InvitationToken.prototype.revoke = async function(adminId, reason) {
    this.status = 'revoked';
    this.revokedAt = new Date();
    this.revokedBy = adminId; // Peut être NULL pour admin hardcodé
    this.revokedReason = reason;
    await this.save();
  };

  // Associations
  InvitationToken.associate = (models) => {
    // Lien avec le générateur (Admin ou Agent)
    // ✅ CORRECTION: required false pour LEFT JOIN (peut être NULL)
    InvitationToken.belongsTo(models.User, {
      foreignKey: 'generatedBy',
      as: 'generator',
      constraints: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Lien avec le revendeur inscrit
    InvitationToken.belongsTo(models.User, {
      foreignKey: 'usedBy',
      as: 'seller',
      constraints: true,
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // ✅ Lien avec celui qui a révoqué (peut être NULL)
    InvitationToken.belongsTo(models.User, {
      foreignKey: 'revokedBy',
      as: 'revoker',
      constraints: false, // Pas de contrainte pour admin hardcodé
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return InvitationToken;
};