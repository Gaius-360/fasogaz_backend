// ==========================================
// FICHIER: scripts/resetAdminPassword.js
// Réinitialise le mot de passe admin en BDD
// Usage:
//   1. Ajouter dans .env : ADMIN_NEW_PASSWORD=NouveauMdp!2026
//   2. node scripts/resetAdminPassword.js
//   3. Supprimer ADMIN_NEW_PASSWORD du .env
// ==========================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

const resetAdminPassword = async () => {
  const newPassword = process.env.ADMIN_NEW_PASSWORD;

  if (!newPassword) {
    console.error('\n❌ Ajoutez ADMIN_NEW_PASSWORD dans .env avant de lancer ce script.');
    console.error('   Exemple: ADMIN_NEW_PASSWORD=NouveauMdp!2026\n');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('\n❌ ADMIN_NEW_PASSWORD trop court (minimum 8 caractères)\n');
    process.exit(1);
  }

  try {
    await db.sequelize.authenticate();

    const admin = await db.User.findOne({ where: { role: 'admin' } });

    if (!admin) {
      console.error('\n❌ Aucun admin trouvé. Lancez d\'abord : node scripts/seedAdmin.js\n');
      process.exit(1);
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await admin.update({ password: hash }, { hooks: false });

    console.log('\n✅ Mot de passe admin réinitialisé.');
    console.log('⚠️  Supprimez ADMIN_NEW_PASSWORD de votre .env maintenant.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    process.exit(1);
  }
};

resetAdminPassword();