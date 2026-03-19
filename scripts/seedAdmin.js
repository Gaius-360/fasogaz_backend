// ==========================================
// FICHIER: scripts/seedAdmin.js
// Crée le compte admin en BDD (à exécuter UNE SEULE FOIS)
// Usage: node scripts/seedAdmin.js
// ==========================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

const validateEnv = () => {
  const required = {
    ADMIN_EMAIL:      process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD:   process.env.ADMIN_PASSWORD,
    ADMIN_FIRST_NAME: process.env.ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME:  process.env.ADMIN_LAST_NAME,
    ADMIN_PHONE:      process.env.ADMIN_PHONE
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.error('\n❌ Variables manquantes dans .env :');
    missing.forEach(k => console.error(`   - ${k}`));
    process.exit(1);
  }
};

const seedAdmin = async () => {
  validateEnv();

  try {
    await db.sequelize.authenticate();
console.log('✅ Connexion BDD établie');

// Créer les tables si elles n'existent pas encore
await db.sequelize.sync({ force: false });
console.log('✅ Tables synchronisées');

    const existing = await db.User.findOne({ where: { role: 'admin' } });

    if (existing) {
      console.log('\n⚠️  Un compte admin existe déjà :');
      console.log(`   Email  : ${existing.email}`);
      console.log(`   Créé   : ${existing.createdAt}`);
      console.log('\nPour réinitialiser le mot de passe :');
      console.log('   node scripts/resetAdminPassword.js\n');
      process.exit(0);
    }

    // hooks: false → empêche le re-hashage par beforeCreate
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    const admin = await db.User.create({
      phone:      process.env.ADMIN_PHONE,
      password:   passwordHash,
      firstName:  process.env.ADMIN_FIRST_NAME,
      lastName:   process.env.ADMIN_LAST_NAME,
      email:      process.env.ADMIN_EMAIL,
      role:       'admin',
      isVerified: true,
      isActive:   true
    }, { hooks: false });

    console.log('\n✅ Admin créé avec succès !');
    console.log('─'.repeat(45));
    console.log(`   ID      : ${admin.id}`);
    console.log(`   Email   : ${admin.email}`);
    console.log(`   Prénom  : ${admin.firstName}`);
    console.log(`   Nom     : ${admin.lastName}`);
    console.log(`   Rôle    : ${admin.role}`);
    console.log('─'.repeat(45));
    console.log('\n⚠️  Supprimez maintenant ADMIN_PASSWORD de votre .env\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur seed :', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('   Ce téléphone ou email est déjà utilisé.');
    }
    process.exit(1);
  }
};

seedAdmin();