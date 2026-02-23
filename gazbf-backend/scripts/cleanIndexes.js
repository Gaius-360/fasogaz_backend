const db = require('../models');

async function cleanIndexes() {
  try {
    console.log('🧹 Nettoyage des index...');
    
    // Récupérer tous les index de la table users
    const [indexes] = await db.sequelize.query(`
      SELECT DISTINCT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users'
      AND INDEX_NAME != 'PRIMARY'
    `);
    
    console.log(`📊 Index trouvés: ${indexes.length}`);
    
    // Garder uniquement les index essentiels
    const keepIndexes = ['idx_phone', 'idx_email', 'phone', 'email'];
    
    for (const idx of indexes) {
      const indexName = idx.INDEX_NAME;
      
      if (!keepIndexes.includes(indexName)) {
        try {
          console.log(`❌ Suppression de l'index: ${indexName}`);
          await db.sequelize.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
        } catch (err) {
          console.log(`⚠️ Impossible de supprimer ${indexName}: ${err.message}`);
        }
      } else {
        console.log(`✅ Conservation de l'index: ${indexName}`);
      }
    }
    
    console.log('✅ Nettoyage terminé !');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanIndexes();