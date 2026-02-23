// ==========================================
// FICHIER: scripts/fixProductCounters.js
// Script pour recalculer les compteurs viewCount et orderCount
// Utilisation: node scripts/fixProductCounters.js
// ==========================================

const db = require('../models');

async function fixProductCounters() {
  try {
    console.log('🔧 RECALCUL DES COMPTEURS DE PRODUITS\n');
    console.log('='.repeat(60));

    // Récupérer tous les produits
    const products = await db.Product.findAll({
      include: [
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName', 'phone']
        }
      ]
    });

    console.log(`\n📦 ${products.length} produits trouvés\n`);

    let updated = 0;

    for (const product of products) {
      console.log(`\n${product.brand} ${product.bottleType} (${product.seller.businessName || product.seller.phone})`);
      console.log('-'.repeat(40));

      // Compter le nombre de commandes contenant ce produit (statut completed)
      const orderCount = await db.OrderItem.count({
        include: [
          {
            model: db.Order,
            as: 'order',
            where: { status: 'completed' },
            required: true
          }
        ],
        where: { productId: product.id }
      });

      console.log(`  Ventes actuelles (DB): ${product.orderCount}`);
      console.log(`  Ventes réelles: ${orderCount}`);
      console.log(`  Vues actuelles: ${product.viewCount}`);

      // Mettre à jour orderCount si différent
      if (product.orderCount !== orderCount) {
        await product.update({ orderCount });
        console.log(`  ✅ orderCount mis à jour: ${product.orderCount} → ${orderCount}`);
        updated++;
      } else {
        console.log(`  ℹ️  orderCount correct`);
      }

      // Note: viewCount ne peut pas être recalculé car ce sont des vues en temps réel
      // On le laisse tel quel
    }

    console.log('\n\n' + '='.repeat(60));
    console.log(`✅ CORRECTION TERMINÉE!`);
    console.log(`${updated} produit(s) mis à jour`);
    console.log('='.repeat(60));
    console.log('\n💡 Les compteurs de vues (viewCount) s\'incrémenteront automatiquement');
    console.log('   lors de la prochaine consultation des produits.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter
fixProductCounters();