// ==========================================
// FICHIER: test-notification.js
// ==========================================
const db = require('./models');
const NotificationService = require('./utils/notificationService');

async function testNotification() {
  try {
    console.log('🧪 DÉBUT DES TESTS DE NOTIFICATIONS\n');
    console.log('='.repeat(60));

    // 1. Test de connexion à la BDD
    console.log('\n📡 Test 1: Connexion à la base de données...');
    await db.sequelize.authenticate();
    console.log('✅ Connexion réussie\n');

    // 2. Vérifier qu'on a des utilisateurs
    console.log('👥 Test 2: Recherche d\'utilisateurs...');
    const users = await db.User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'role', 'phone'],
      limit: 3
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la BDD');
      return;
    }

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):`);
    users.forEach(u => {
      console.log(`   - ${u.firstName} ${u.lastName} (${u.role}) - ID: ${u.id}`);
    });

    const testUser = users[0];
    console.log(`\n🎯 Utilisateur de test sélectionné: ${testUser.firstName} ${testUser.lastName}\n`);

    // 3. Test de création directe via le modèle
    console.log('📝 Test 3: Création directe d\'une notification...');
    const directNotif = await db.Notification.create({
      userId: testUser.id,
      type: 'system',
      title: '🧪 Test Direct - Création via modèle',
      message: 'Cette notification a été créée directement via le modèle Sequelize',
      priority: 'high',
      data: {
        testType: 'direct',
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Notification créée:');
    console.log(`   ID: ${directNotif.id}`);
    console.log(`   Titre: ${directNotif.title}`);
    console.log(`   Type: ${directNotif.type}`);
    console.log(`   Priorité: ${directNotif.priority}\n`);

    // 4. Test via NotificationService
    console.log('🔔 Test 4: Création via NotificationService...');
    await NotificationService.notifySubscriptionExpiring(testUser.id, 7, new Date());
    console.log('✅ Notification d\'expiration créée\n');

    // 5. Vérifier le nombre total de notifications
    console.log('📊 Test 5: Comptage des notifications...');
    const totalCount = await db.Notification.count({
      where: { userId: testUser.id }
    });
    console.log(`✅ Total notifications pour ${testUser.firstName}: ${totalCount}\n`);

    // 6. Récupérer les notifications
    console.log('📋 Test 6: Récupération des notifications...');
    const notifications = await db.Notification.findAll({
      where: { userId: testUser.id },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    console.log(`✅ ${notifications.length} notification(s) récupérée(s):`);
    notifications.forEach((n, index) => {
      console.log(`\n   ${index + 1}. ${n.title}`);
      console.log(`      Type: ${n.type}`);
      console.log(`      Message: ${n.message.substring(0, 60)}...`);
      console.log(`      Lu: ${n.isRead ? 'Oui' : 'Non'}`);
      console.log(`      Créé le: ${n.createdAt}`);
    });

    // 7. Test du comptage des non-lues
    console.log('\n\n📬 Test 7: Comptage des non-lues...');
    const unreadCount = await db.Notification.count({
      where: {
        userId: testUser.id,
        isRead: false
      }
    });
    console.log(`✅ Notifications non lues: ${unreadCount}\n`);

    // 8. Test de marquage comme lu
    if (notifications.length > 0) {
      console.log('✓ Test 8: Marquage comme lu...');
      const firstNotif = notifications[0];
      await firstNotif.update({
        isRead: true,
        readAt: new Date()
      });
      console.log(`✅ Notification "${firstNotif.title}" marquée comme lue\n`);
    }

    // 9. Vérification finale
    console.log('🔍 Test 9: Vérification finale...');
    const finalUnreadCount = await db.Notification.count({
      where: {
        userId: testUser.id,
        isRead: false
      }
    });
    console.log(`✅ Notifications non lues après marquage: ${finalUnreadCount}\n`);

    console.log('='.repeat(60));
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS ! Le système de notifications fonctionne.\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERREUR LORS DU TEST:');
    console.error('='.repeat(60));
    console.error('\nMessage:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.error('\n' + '='.repeat(60));
  } finally {
    await db.sequelize.close();
    console.log('🔌 Connexion à la BDD fermée\n');
  }
}

// Lancer le test
console.log('\n');
testNotification();