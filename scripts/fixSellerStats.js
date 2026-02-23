// ==========================================
// FICHIER: scripts/fixSellerStats.js
// Script de diagnostic et correction des statistiques
// Utilisation: node scripts/fixSellerStats.js
// ==========================================

const db = require('../models');
const { QueryTypes } = require('sequelize');

async function fixSellerStats() {
  try {
    console.log('🔍 DIAGNOSTIC DES STATISTIQUES\n');
    console.log('='.repeat(60));

    // 1. Vérifier la structure de la table
    console.log('\n📋 Vérification de la structure de la table users...');
    const columns = await db.sequelize.query(
      "DESCRIBE users",
      { type: QueryTypes.SELECT }
    );

    // columns est un tableau directement
    const columnArray = Array.isArray(columns) ? columns : columns[0];

    const hasColumns = {
      totalOrders: columnArray.some(c => c.Field === 'totalOrders'),
      completedOrders: columnArray.some(c => c.Field === 'completedOrders'),
      averageRating: columnArray.some(c => c.Field === 'averageRating'),
      totalReviews: columnArray.some(c => c.Field === 'totalReviews')
    };

    console.log('\nColonnes de statistiques:');
    console.log(`  totalOrders: ${hasColumns.totalOrders ? '✅' : '❌ MANQUANTE'}`);
    console.log(`  completedOrders: ${hasColumns.completedOrders ? '✅' : '❌ MANQUANTE'}`);
    console.log(`  averageRating: ${hasColumns.averageRating ? '✅' : '❌ MANQUANTE'}`);
    console.log(`  totalReviews: ${hasColumns.totalReviews ? '✅' : '❌ MANQUANTE'}`);

    // 2. Ajouter les colonnes manquantes
    const missingColumns = Object.entries(hasColumns)
      .filter(([_, exists]) => !exists)
      .map(([col, _]) => col);

    if (missingColumns.length > 0) {
      console.log('\n⚠️  Colonnes manquantes détectées!');
      console.log('🔧 Ajout des colonnes...');

      for (const column of missingColumns) {
        let sql = '';
        switch (column) {
          case 'totalOrders':
          case 'completedOrders':
          case 'totalReviews':
            sql = `ALTER TABLE users ADD COLUMN ${column} INT DEFAULT 0 NOT NULL`;
            break;
          case 'averageRating':
            sql = `ALTER TABLE users ADD COLUMN ${column} DECIMAL(2,1) DEFAULT 0 NOT NULL`;
            break;
        }
        
        try {
          await db.sequelize.query(sql);
          console.log(`  ✅ ${column} ajoutée`);
        } catch (error) {
          console.log(`  ⚠️  ${column}: ${error.message}`);
        }
      }
    }

    // 3. Récupérer tous les revendeurs
    console.log('\n\n📊 RECALCUL DES STATISTIQUES\n');
    console.log('='.repeat(60));

    const sellers = await db.User.findAll({
      where: { role: 'revendeur' }
    });

    console.log(`\n${sellers.length} revendeur(s) trouvé(s)\n`);

    // 4. Pour chaque revendeur, recalculer les stats
    for (const seller of sellers) {
      console.log(`\n👤 ${seller.businessName || seller.phone}`);
      console.log('-'.repeat(40));

      // Récupérer les commandes
      const allOrders = await db.Order.findAll({
        where: { sellerId: seller.id }
      });

      const completedOrdersList = allOrders.filter(o => o.status === 'completed');

      // Récupérer les avis
      const reviews = await db.Review.findAll({
        where: { sellerId: seller.id }
      });

      // Calculer la note moyenne
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Afficher les stats calculées
      console.log(`Commandes totales: ${allOrders.length}`);
      console.log(`Commandes complétées: ${completedOrdersList.length}`);
      console.log(`Total avis: ${reviews.length}`);
      console.log(`Note moyenne: ${avgRating.toFixed(1)}/5`);

      // Mettre à jour
      const updated = await seller.update({
        totalOrders: allOrders.length,
        completedOrders: completedOrdersList.length,
        totalReviews: reviews.length,
        averageRating: parseFloat(avgRating.toFixed(1))
      });

      console.log('✅ Statistiques mises à jour');

      // Vérification
      await seller.reload();
      console.log('\nVérification après mise à jour:');
      console.log(`  totalOrders DB: ${seller.totalOrders}`);
      console.log(`  completedOrders DB: ${seller.completedOrders}`);
      console.log(`  totalReviews DB: ${seller.totalReviews}`);
      console.log(`  averageRating DB: ${seller.averageRating}`);
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ CORRECTION TERMINÉE AVEC SUCCÈS!');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
fixSellerStats();