// ==========================================
// FICHIER: scripts/recalculateSellerStats.js
// Script pour recalculer les statistiques de tous les revendeurs
// Utilisation: node scripts/recalculateSellerStats.js
// ==========================================

const db = require('../models');

async function recalculateSellerStats() {
  try {
    console.log('🔄 Début du recalcul des statistiques...\n');

    // Récupérer tous les revendeurs
    const sellers = await db.User.findAll({
      where: { role: 'revendeur' }
    });

    console.log(`📊 ${sellers.length} revendeurs trouvés\n`);

    for (const seller of sellers) {
      // Récupérer toutes les commandes du revendeur
      const orders = await db.Order.findAll({
        where: { sellerId: seller.id }
      });

      // Récupérer tous les avis du revendeur
      const reviews = await db.Review.findAll({
        where: { sellerId: seller.id }
      });

      // Calculer les statistiques
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

      // Mettre à jour le revendeur
      await seller.update({
        totalOrders,
        completedOrders,
        totalReviews,
        averageRating: parseFloat(averageRating)
      });

      console.log(`✅ ${seller.businessName || seller.phone}:`);
      console.log(`   - Commandes totales: ${totalOrders}`);
      console.log(`   - Commandes complétées: ${completedOrders}`);
      console.log(`   - Avis totaux: ${totalReviews}`);
      console.log(`   - Note moyenne: ${averageRating}/5`);
      console.log('');
    }

    console.log('✅ Recalcul terminé avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du recalcul:', error);
    process.exit(1);
  }
}

// Exécuter le script
recalculateSellerStats();