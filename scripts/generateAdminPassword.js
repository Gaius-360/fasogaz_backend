// ==========================================
// FICHIER: scripts/generateAdminPassword.js
// Script pour générer le hash du mot de passe admin
// ==========================================

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Valider le mot de passe selon les règles de sécurité
 */
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('- Minimum 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('- Au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('- Au moins une minuscule');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('- Au moins un chiffre');
  }

  if (!/[@$!%*?&#]/.test(password)) {
    errors.push('- Au moins un caractère spécial (@$!%*?&#)');
  }

  return errors;
}

/**
 * Générer le hash bcrypt
 */
async function generateHash(password) {
  console.log('\n🔐 Génération du hash bcrypt...\n');
  
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  
  return hash;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   GÉNÉRATEUR DE MOT DE PASSE ADMIN - FASOGAZ         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('📋 Règles de sécurité du mot de passe:');
  console.log('   • Minimum 8 caractères');
  console.log('   • Au moins une majuscule');
  console.log('   • Au moins une minuscule');
  console.log('   • Au moins un chiffre');
  console.log('   • Au moins un caractère spécial (@$!%*?&#)\n');

  rl.question('Entrez le mot de passe admin: ', async (password) => {
    
    // Valider le mot de passe
    const errors = validatePassword(password);
    
    if (errors.length > 0) {
      console.log('\n❌ Mot de passe invalide:');
      errors.forEach(error => console.log(error));
      console.log('\n');
      rl.close();
      process.exit(1);
    }

    rl.question('Confirmez le mot de passe: ', async (confirmPassword) => {
      
      if (password !== confirmPassword) {
        console.log('\n❌ Les mots de passe ne correspondent pas!\n');
        rl.close();
        process.exit(1);
      }

      try {
        const hash = await generateHash(password);
        
        console.log('╔═══════════════════════════════════════════════════════╗');
        console.log('║                 ✅ SUCCÈS                             ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');

        console.log('📝 Ajoutez cette ligne dans votre fichier .env:\n');
        console.log('─────────────────────────────────────────────────────────');
        console.log(`ADMIN_PASSWORD_HASH=${hash}`);
        console.log('─────────────────────────────────────────────────────────\n');

        console.log('⚠️  IMPORTANT:');
        console.log('   1. Copiez le hash ci-dessus dans votre .env');
        console.log('   2. Ne partagez JAMAIS ce hash');
        console.log('   3. Ajoutez .env dans votre .gitignore');
        console.log('   4. Redémarrez votre serveur après modification\n');

        console.log('💡 Exemple de configuration .env complète:\n');
        console.log('   ADMIN_USERNAME=admin');
        console.log('   ADMIN_FIRST_NAME=Admin');
        console.log('   ADMIN_LAST_NAME=Principal');
        console.log('   ADMIN_EMAIL=admin@gazbf.bf');
        console.log(`   ADMIN_PASSWORD_HASH=${hash}`);
        console.log('   JWT_SECRET=votre_secret_jwt_très_long_et_aléatoire\n');

      } catch (error) {
        console.error('\n❌ Erreur lors de la génération du hash:', error);
      }

      rl.close();
    });
  });
}

// Exécuter le script
main().catch(console.error);