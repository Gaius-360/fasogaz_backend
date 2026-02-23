// ==========================================
// MIGRATION: Ajouter support des agents terrain
// Nom du fichier: YYYYMMDDHHMMSS-add-agent-support.js
// ==========================================

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Début migration agents...');
      
      // 1. Modifier l'ENUM role pour ajouter 'agent'
      console.log('📝 Modification du rôle pour inclure "agent"...');
      await queryInterface.sequelize.query(
        `ALTER TABLE users MODIFY COLUMN role ENUM('client', 'revendeur', 'admin', 'agent') NOT NULL DEFAULT 'client'`,
        { transaction }
      );
      console.log('✅ Rôle "agent" ajouté');
      
      // 2. Ajouter la colonne agentCode
      console.log('📝 Ajout de la colonne agentCode...');
      await queryInterface.addColumn(
        'users',
        'agentCode',
        {
          type: Sequelize.STRING(20),
          allowNull: true,
          unique: true,
          comment: 'Code unique de l\'agent (format: AG-XXXXXXXX)'
        },
        { transaction }
      );
      console.log('✅ Colonne agentCode ajoutée');
      
      // 3. Ajouter la colonne agentZone
      console.log('📝 Ajout de la colonne agentZone...');
      await queryInterface.addColumn(
        'users',
        'agentZone',
        {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Zone d\'affectation de l\'agent'
        },
        { transaction }
      );
      console.log('✅ Colonne agentZone ajoutée');
      
      // 4. Ajouter la colonne isAgentActive
      console.log('📝 Ajout de la colonne isAgentActive...');
      await queryInterface.addColumn(
        'users',
        'isAgentActive',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: 'Statut actif/inactif de l\'agent'
        },
        { transaction }
      );
      console.log('✅ Colonne isAgentActive ajoutée');
      
      // 5. Ajouter la colonne agentStats
      console.log('📝 Ajout de la colonne agentStats...');
      await queryInterface.addColumn(
        'users',
        'agentStats',
        {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Statistiques de l\'agent (JSON)'
        },
        { transaction }
      );
      console.log('✅ Colonne agentStats ajoutée');
      
      // 6. Créer l'index unique sur agentCode
      console.log('📝 Création de l\'index sur agentCode...');
      await queryInterface.addIndex(
        'users',
        ['agentCode'],
        {
          name: 'idx_users_agentCode',
          unique: true,
          transaction
        }
      );
      console.log('✅ Index agentCode créé');
      
      // 7. Créer l'index composite sur role + isAgentActive
      console.log('📝 Création de l\'index role_agentActive...');
      await queryInterface.addIndex(
        'users',
        ['role', 'isAgentActive'],
        {
          name: 'idx_users_role_agentActive',
          transaction
        }
      );
      console.log('✅ Index role_agentActive créé');
      
      await transaction.commit();
      console.log('✅ Migration agents terminée avec succès !');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rollback migration agents...');
      
      // Supprimer les index
      await queryInterface.removeIndex('users', 'idx_users_agentCode', { transaction });
      await queryInterface.removeIndex('users', 'idx_users_role_agentActive', { transaction });
      
      // Supprimer les colonnes
      await queryInterface.removeColumn('users', 'agentCode', { transaction });
      await queryInterface.removeColumn('users', 'agentZone', { transaction });
      await queryInterface.removeColumn('users', 'isAgentActive', { transaction });
      await queryInterface.removeColumn('users', 'agentStats', { transaction });
      
      // Restaurer l'ENUM role sans 'agent'
      await queryInterface.sequelize.query(
        `ALTER TABLE users MODIFY COLUMN role ENUM('client', 'revendeur', 'admin') NOT NULL DEFAULT 'client'`,
        { transaction }
      );
      
      await transaction.commit();
      console.log('✅ Rollback terminé');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors du rollback:', error);
      throw error;
    }
  }
};