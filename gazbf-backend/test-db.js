const db = require('./models');

async function testDatabase() {
  try {
    console.log('🔄 Test de connexion à la base de données...');
    
    await db.sequelize.authenticate();
    console.log('✅ Connexion réussie!');
    
    console.log('🔄 Synchronisation des modèles...');
    await db.sequelize.sync({ force: false, alter: true });
    console.log('✅ Modèles synchronisés!');
    
    console.log('\n📊 Tables créées:');
    const tables = await db.sequelize.getQueryInterface().showAllTables();
    tables.forEach(table => console.log(`   - ${table}`));
    
    console.log('\n✅ Test terminé avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testDatabase();