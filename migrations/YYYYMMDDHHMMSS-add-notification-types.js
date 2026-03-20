// ==========================================
// FICHIER: migrations/YYYYMMDDHHMMSS-add-notification-types.js
//
// ⚠️  RENOMMER avec un timestamp réel (APRÈS la migration review) :
//     ex: 20250320120001-add-notification-types.js
//
// Jouer :  npx sequelize-cli db:migrate
// Annuler: npx sequelize-cli db:migrate:undo
//
// ✅ PostgreSQL : ALTER TYPE ... ADD VALUE ne supporte pas
//    IF NOT EXISTS avant PG 9.6 — on vérifie manuellement.
//    ADD VALUE ne peut pas être exécuté dans une transaction
//    → chaque ajout passe par un appel sequelize.query séparé
//    hors transaction (Sequelize wraps migrations in transactions
//    by default — on désactive avec transaction: false).
// ==========================================

'use strict';

module.exports = {
  // ✅ Désactiver la transaction automatique de Sequelize :
  //    ALTER TYPE ... ADD VALUE est interdit dans un bloc transactionnel
  //    sur PostgreSQL (erreur: "cannot run inside a transaction block").
  transaction: false,

  async up(queryInterface) {
    // Valeurs à garantir dans enum_notifications_type
    const valuesToAdd = [
      'review_received',
      'review_response',
    ];

    for (const value of valuesToAdd) {
      // Vérifier si la valeur existe déjà avant de tenter l'ajout
      const [rows] = await queryInterface.sequelize.query(`
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'enum_notifications_type'
          AND e.enumlabel = '${value}';
      `);

      if (rows.length === 0) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_notifications_type" ADD VALUE '${value}';`
        );
        console.log(`✅ Valeur '${value}' ajoutée à enum_notifications_type`);
      } else {
        console.log(`ℹ️  Valeur '${value}' déjà présente, ignorée`);
      }
    }
  },

  async down() {
    // ⚠️  PostgreSQL ne permet pas de supprimer une valeur d'un type ENUM
    //    (ALTER TYPE ... DROP VALUE n'existe pas).
    //    Le rollback est un no-op documenté — pour supprimer une valeur ENUM
    //    il faudrait recréer le type entier, ce qui est destructif.
    console.log(
      '⚠️  Rollback ignoré : PostgreSQL ne supporte pas DROP VALUE sur un ENUM. ' +
      'Les valeurs review_received / review_response restent dans enum_notifications_type.'
    );
  }
};