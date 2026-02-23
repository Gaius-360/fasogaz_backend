#!/usr/bin/env node

// ==========================================
// FICHIER: scripts/migrateToProduction.js
// Script de migration vers la version sécurisée
// ==========================================

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   MIGRATION VERS VERSION SÉCURISÉE - FASOGAZ         ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

console.log('📋 Ce script va vous aider à migrer depuis la version de test\n');
console.log('   vers la version sécurisée pour la production.\n');

console.log('⚠️  AVANT DE CONTINUER:\n');
console.log('   1. Assurez-vous d\'avoir installé bcryptjs: npm install bcryptjs');
console.log('   2. Faites un backup de votre code actuel');
console.log('   3. Préparez votre nouveau mot de passe admin\n');

rl.question('Voulez-vous continuer ? (oui/non): ', async (answer) => {
  
  if (answer.toLowerCase() !== 'oui') {
    console.log('\n❌ Migration annulée.\n');
    rl.close();
    process.exit(0);
  }

  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('📝 ÉTAPE 1/5: Vérification de l\'environnement\n');

  // Vérifier bcryptjs
  try {
    require('bcryptjs');
    console.log('✅ bcryptjs est installé');
  } catch (error) {
    console.log('❌ bcryptjs n\'est pas installé');
    console.log('\n   Installez-le avec: npm install bcryptjs\n');
    rl.close();
    process.exit(1);
  }

  // Vérifier si .env existe déjà
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('⚠️  Un fichier .env existe déjà');
    
    rl.question('   Voulez-vous le sauvegarder ? (oui/non): ', (backup) => {
      if (backup.toLowerCase() === 'oui') {
        const backupPath = path.join(process.cwd(), '.env.backup');
        fs.copyFileSync(envPath, backupPath);
        console.log(`✅ Sauvegarde créée: ${backupPath}`);
      }
      
      continueStep2();
    });
  } else {
    console.log('✅ Pas de fichier .env existant');
    continueStep2();
  }
});

function continueStep2() {
  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('📝 ÉTAPE 2/5: Génération du mot de passe admin\n');
  console.log('⚠️  Votre ancien mot de passe "Admin@2025" ne sera plus utilisable.');
  console.log('   Vous devez choisir un NOUVEAU mot de passe sécurisé.\n');

  console.log('Règles du mot de passe:');
  console.log('  • Minimum 8 caractères');
  console.log('  • Au moins une majuscule');
  console.log('  • Au moins une minuscule');
  console.log('  • Au moins un chiffre');
  console.log('  • Au moins un caractère spécial (@$!%*?&#)\n');

  rl.question('Appuyez sur Entrée pour lancer le générateur de mot de passe...', () => {
    console.log('\n📋 Exécutez cette commande dans un autre terminal:\n');
    console.log('   npm run generate-admin-password\n');
    console.log('Puis revenez ici et collez le hash généré.\n');

    rl.question('Collez le ADMIN_PASSWORD_HASH généré: ', (hash) => {
      if (!hash || hash.length < 50) {
        console.log('\n❌ Hash invalide. Réessayez.\n');
        rl.close();
        process.exit(1);
      }

      continueStep3(hash.trim());
    });
  });
}

function continueStep3(passwordHash) {
  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('📝 ÉTAPE 3/5: Configuration du compte admin\n');

  rl.question('Nom d\'utilisateur admin [admin]: ', (username) => {
    username = username.trim() || 'admin';

    rl.question('Email admin [admin@gazbf.bf]: ', (email) => {
      email = email.trim() || 'admin@gazbf.bf';

      rl.question('Prénom [Admin]: ', (firstName) => {
        firstName = firstName.trim() || 'Admin';

        rl.question('Nom [Principal]: ', (lastName) => {
          lastName = lastName.trim() || 'Principal';

          continueStep4({
            username,
            email,
            firstName,
            lastName,
            passwordHash
          });
        });
      });
    });
  });
}

function continueStep4(adminConfig) {
  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('📝 ÉTAPE 4/5: Génération du JWT Secret\n');
  console.log('📋 Exécutez cette commande dans un autre terminal:\n');
  console.log('   npm run generate-jwt-secret\n');
  console.log('Puis revenez ici et collez le secret généré.\n');

  rl.question('Collez le JWT_SECRET généré: ', (jwtSecret) => {
    if (!jwtSecret || jwtSecret.trim().length < 32) {
      console.log('\n❌ JWT Secret trop court (minimum 32 caractères).\n');
      rl.close();
      process.exit(1);
    }

    adminConfig.jwtSecret = jwtSecret.trim();
    continueStep5(adminConfig);
  });
}

function continueStep5(adminConfig) {
  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('📝 ÉTAPE 5/5: Création du fichier .env\n');

  const envContent = `# ==========================================
# Configuration PRODUCTION - FasoGaz
# Généré automatiquement par migrateToProduction.js
# ==========================================

# Environnement
NODE_ENV=production
PORT=5000

# Base de données
MONGODB_URI=mongodb://localhost:27017/fasogaz_production

# ==========================================
# ADMIN - CONFIGURATION
# ==========================================
ADMIN_USERNAME=${adminConfig.username}
ADMIN_EMAIL=${adminConfig.email}
ADMIN_FIRST_NAME=${adminConfig.firstName}
ADMIN_LAST_NAME=${adminConfig.lastName}
ADMIN_PASSWORD_HASH=${adminConfig.passwordHash}

# ==========================================
# JWT SECRET
# ==========================================
JWT_SECRET=${adminConfig.jwtSecret}

# ==========================================
# CORS
# ==========================================
CORS_ORIGIN=http://localhost:3000
`;

  const envPath = path.join(process.cwd(), '.env');

  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`✅ Fichier .env créé: ${envPath}\n`);
  } catch (error) {
    console.log('❌ Erreur lors de la création du .env:', error.message);
    console.log('\nContenu à copier manuellement:\n');
    console.log('─'.repeat(60));
    console.log(envContent);
    console.log('─'.repeat(60));
  }

  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS !\n');

  console.log('📋 RÉSUMÉ DE LA CONFIGURATION:\n');
  console.log(`   Username     : ${adminConfig.username}`);
  console.log(`   Email        : ${adminConfig.email}`);
  console.log(`   Nom complet  : ${adminConfig.firstName} ${adminConfig.lastName}`);
  console.log(`   Hash MDP     : ${adminConfig.passwordHash.substring(0, 20)}...`);
  console.log(`   JWT Secret   : ${adminConfig.jwtSecret.substring(0, 20)}...\n`);

  console.log('⚠️  ACTIONS REQUISES:\n');
  console.log('   1. ✅ Fichier .env créé');
  console.log('   2. ⚠️  Remplacer les fichiers suivants:\n');
  console.log('      - controllers/adminAuthController.js');
  console.log('      - middleware/adminAuth.js');
  console.log('      - pages/admin/AdminLogin.jsx\n');
  console.log('   3. ⚠️  Vérifier la configuration:\n');
  console.log('      npm run test-admin-config\n');
  console.log('   4. ⚠️  Redémarrer le serveur:\n');
  console.log('      npm start\n');

  console.log('🔐 SÉCURITÉ:\n');
  console.log('   • Le fichier .env est dans .gitignore');
  console.log('   • Ne JAMAIS commit le .env dans Git');
  console.log('   • Gardez le mot de passe secret\n');

  console.log('📖 DOCUMENTATION:\n');
  console.log('   • README_SECURITE.md : Guide rapide');
  console.log('   • GUIDE_DEPLOIEMENT_SECURISE.md : Guide complet\n');

  rl.close();
}