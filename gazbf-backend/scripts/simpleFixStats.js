// ==========================================
// FICHIER: scripts/simpleFixStats.js
// Script simplifié pour ajouter les colonnes et recalculer
// Utilisation: node scripts/simpleFixStats.js
// ==========================================

const db = require('../models');

async function simpleFixStats() {
  try {
    console.log('🔧 CORRECTION DES STATISTIQUES\n');
    console.log('='.repeat(60));

    // 1. Ajouter les colonnes via SQL brut (plus fiable)
    console.log('\n📝 Ajout des colonnes manquantes...\n');

    try {
      await db.sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN totalOrders INT DEFAULT 0 NOT NULL 
        COMMENT 'Nombre total de commandes reçues'
      `);
      console.log('✅ Colonne totalOrders ajoutée');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('ℹ️  totalOrders existe déjà');
      } else {
        console.log('⚠️  totalOrders:', error.message);
      }
    }

    try {
      await db.sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN completedOrders INT DEFAULT 0 NOT NULL 
        COMMENT 'Nombre de commandes complétées'
      `);
      console.log('✅ Colonne completedOrders ajoutée');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('ℹ️  completedOrders existe déjà');
      } else {
        console.log('⚠️  completedOrders:', error.message);
      }
    }

    // 2. Vérifier que les colonnes existent maintenant
    console.log('\n📋 Vérification...\n');
    const [columns] = await db.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('totalOrders', 'completedOrders')
    `);

    console.log(`Colonnes trouvées: ${columns.map(c => c.COLUMN_NAME).join(', ')}\n`);

    // 3. Récupérer tous les revendeurs
    console.log('='.repeat(60));
    console.log('📊 RECALCUL DES STATISTIQUES\n');

    const sellers = await db.User.findAll({
      where: { role: 'revendeur' },
      attributes: ['id', 'businessName', 'phone']
    });

    console.log(`${sellers.length} revendeur(s) trouvé(s)\n`);

    if (sellers.length === 0) {
      console.log('⚠️  Aucun revendeur trouvé dans la base de données');
      process.exit(0);
    }

    // 4. Pour chaque revendeur, recalculer les stats
    for (const seller of sellers) {
      console.log(`\n👤 ${seller.businessName || seller.phone}`);
      console.log('-'.repeat(40));

      try {
        // Compter les commandes
        const totalOrders = await db.Order.count({
          where: { sellerId: seller.id }
        });

        const completedOrders = await db.Order.count({
          where: { 
            sellerId: seller.id,
            status: 'completed'
          }
        });

        // Compter les avis et calculer la moyenne
        const reviews = await db.Review.findAll({
          where: { sellerId: seller.id },
          attributes: ['rating']
        });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

        console.log(`  Commandes totales: ${totalOrders}`);
        console.log(`  Commandes complétées: ${completedOrders}`);
        console.log(`  Total avis: ${totalReviews}`);
        console.log(`  Note moyenne: ${averageRating.toFixed(2)}/5`);

        // Mettre à jour via SQL brut pour être sûr
        await db.sequelize.query(`
          UPDATE users 
          SET 
            totalOrders = :totalOrders,
            completedOrders = :completedOrders,
            totalReviews = :totalReviews,
            averageRating = :averageRating
          WHERE id = :sellerId
        `, {
          replacements: {
            totalOrders,
            completedOrders,
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(2)),
            sellerId: seller.id
          }
        });

        console.log('  ✅ Statistiques mises à jour');

        // Vérification
        const [updatedUser] = await db.sequelize.query(`
          SELECT totalOrders, completedOrders, totalReviews, averageRating 
          FROM users 
          WHERE id = :sellerId
        `, {
          replacements: { sellerId: seller.id }
        });

        if (updatedUser.length > 0) {
          const user = updatedUser[0];
          console.log(`  ✓ Vérification DB:`);
          console.log(`    - totalOrders: ${user.totalOrders}`);
          console.log(`    - completedOrders: ${user.completedOrders}`);
          console.log(`    - totalReviews: ${user.totalReviews}`);
          console.log(`    - averageRating: ${user.averageRating}`);
        }

      } catch (error) {
        console.error(`  ❌ Erreur pour ${seller.businessName}:`, error.message);
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ CORRECTION TERMINÉE AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\n💡 Vous pouvez maintenant redémarrer votre serveur\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Exécuter le script
console.log('🚀 Démarrage du script de correction...\n');
simpleFixStats();