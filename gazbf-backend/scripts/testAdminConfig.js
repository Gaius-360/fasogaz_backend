// ==========================================
// FICHIER: scripts/testAdminConfig.js
// Script de vérification de configuration admin
// ==========================================

require('dotenv').config();
const bcrypt = require('bcryptjs');

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║     VÉRIFICATION CONFIGURATION ADMIN - FASOGAZ        ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Test des variables d'environnement
console.log('📋 Variables d\'environnement:\n');

const checks = [
  {
    name: 'NODE_ENV',
    value: process.env.NODE_ENV,
    required: false,
    status: process.env.NODE_ENV ? '✅' : '⚠️ '
  },
  {
    name: 'ADMIN_USERNAME',
    value: process.env.ADMIN_USERNAME,
    required: true,
    status: process.env.ADMIN_USERNAME ? '✅' : '❌'
  },
  {
    name: 'ADMIN_FIRST_NAME',
    value: process.env.ADMIN_FIRST_NAME,
    required: false,
    status: process.env.ADMIN_FIRST_NAME ? '✅' : '⚠️ '
  },
  {
    name: 'ADMIN_LAST_NAME',
    value: process.env.ADMIN_LAST_NAME,
    required: false,
    status: process.env.ADMIN_LAST_NAME ? '✅' : '⚠️ '
  },
  {
    name: 'ADMIN_EMAIL',
    value: process.env.ADMIN_EMAIL,
    required: false,
    status: process.env.ADMIN_EMAIL ? '✅' : '⚠️ '
  },
  {
    name: 'ADMIN_PASSWORD_HASH',
    value: process.env.ADMIN_PASSWORD_HASH ? '(hash présent)' : '(non défini)',
    required: true,
    status: process.env.ADMIN_PASSWORD_HASH ? '✅' : '❌'
  },
  {
    name: 'JWT_SECRET',
    value: process.env.JWT_SECRET ? `(${process.env.JWT_SECRET.length} caractères)` : '(non défini)',
    required: true,
    status: process.env.JWT_SECRET ? '✅' : '❌'
  }
];

let hasErrors = false;
let hasWarnings = false;

checks.forEach(check => {
  console.log(`${check.status} ${check.name.padEnd(25)} : ${check.value || '(non défini)'}`);
  
  if (check.required && !check.value) {
    hasErrors = true;
  }
  
  if (!check.required && !check.value) {
    hasWarnings = true;
  }
});

console.log('\n' + '─'.repeat(60) + '\n');

// Vérifier la validité du hash bcrypt
if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('🔐 Validation du hash bcrypt:\n');
  
  const hashPattern = /^\$2[ayb]\$.{56}$/;
  const isValidFormat = hashPattern.test(process.env.ADMIN_PASSWORD_HASH);
  
  if (isValidFormat) {
    console.log('✅ Format du hash : Valide');
    console.log(`✅ Longueur       : ${process.env.ADMIN_PASSWORD_HASH.length} caractères`);
  } else {
    console.log('❌ Format du hash : Invalide');
    console.log('⚠️  Le hash ne semble pas être au format bcrypt correct');
    hasErrors = true;
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
}

// Vérifier la force du JWT_SECRET
if (process.env.JWT_SECRET) {
  console.log('🔑 Validation JWT_SECRET:\n');
  
  const secretLength = process.env.JWT_SECRET.length;
  
  if (secretLength >= 64) {
    console.log(`✅ Longueur       : ${secretLength} caractères (Excellent)`);
  } else if (secretLength >= 32) {
    console.log(`⚠️  Longueur       : ${secretLength} caractères (Acceptable, recommandé: 64+)`);
    hasWarnings = true;
  } else {
    console.log(`❌ Longueur       : ${secretLength} caractères (Trop court! Minimum: 32)`);
    hasErrors = true;
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
}

// Résumé
console.log('📊 RÉSUMÉ:\n');

if (!hasErrors && !hasWarnings) {
  console.log('✅ Configuration parfaite!');
  console.log('   Tous les paramètres sont correctement configurés.\n');
  process.exit(0);
} else if (!hasErrors && hasWarnings) {
  console.log('⚠️  Configuration valide avec avertissements:');
  console.log('   Certains paramètres optionnels ne sont pas définis.');
  console.log('   Le système fonctionnera mais utilisera des valeurs par défaut.\n');
  
  console.log('💡 Recommandations:');
  if (!process.env.ADMIN_FIRST_NAME || !process.env.ADMIN_LAST_NAME) {
    console.log('   - Définir ADMIN_FIRST_NAME et ADMIN_LAST_NAME');
  }
  if (!process.env.ADMIN_EMAIL) {
    console.log('   - Définir ADMIN_EMAIL');
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
    console.log('   - Générer un JWT_SECRET plus long (64+ caractères)');
    console.log('     Commande: npm run generate-jwt-secret');
  }
  console.log();
  process.exit(0);
} else {
  console.log('❌ Configuration incomplète ou invalide!\n');
  
  console.log('⚠️  Actions requises:');
  if (!process.env.ADMIN_USERNAME) {
    console.log('   1. Définir ADMIN_USERNAME dans .env');
  }
  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.log('   2. Générer le hash du mot de passe:');
    console.log('      npm run generate-admin-password');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.log('   3. Générer un JWT_SECRET sécurisé:');
    console.log('      npm run generate-jwt-secret');
  }
  
  console.log('\n📖 Consultez le guide: GUIDE_DEPLOIEMENT_SECURISE.md\n');
  process.exit(1);
}