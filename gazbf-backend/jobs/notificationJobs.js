// ==========================================
// FICHIER: jobs/notificationJobs.js
// Tâches CRON pour notifications automatiques
// ==========================================
const cron = require('node-cron');
const db = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('../utils/notificationService');

// ==========================================
// VÉRIFIER LES ABONNEMENTS QUI EXPIRENT BIENTÔT
// Exécuté tous les jours à 10h
// ==========================================
const checkExpiringSubscriptions = cron.schedule('0 10 * * *', async () => {
  console.log('🔔 Vérification des abonnements qui expirent...');
  
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Trouver les revendeurs dont l'abonnement expire dans 3 ou 7 jours
    const expiringSubscriptions = await db.User.findAll({
      where: {
        role: 'revendeur',
        isActive: true,
        hasActiveSubscription: true,
        subscriptionEndDate: {
          [Op.between]: [now, sevenDaysFromNow]
        }
      }
    });

    for (const seller of expiringSubscriptions) {
      const endDate = new Date(seller.subscriptionEndDate);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Notifier à 7j, 3j et 1j
      if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
        await NotificationService.notifySubscriptionExpiring(
          seller.id,
          daysRemaining,
          seller.subscriptionEndDate
        );
        console.log(`✅ Notification envoyée: ${seller.businessName} (${daysRemaining}j)`);
      }
    }

    console.log(`✅ ${expiringSubscriptions.length} notification(s) d'expiration envoyée(s)`);
  } catch (error) {
    console.error('❌ Erreur vérification abonnements:', error);
  }
}, {
  scheduled: false // Ne démarre pas automatiquement
});

// ==========================================
// VÉRIFIER LES ABONNEMENTS EXPIRÉS
// Exécuté tous les jours à 1h du matin
// ==========================================
const checkExpiredSubscriptions = cron.schedule('0 1 * * *', async () => {
  console.log('🔔 Vérification des abonnements expirés...');
  
  try {
    const now = new Date();

    // Trouver les revendeurs dont l'abonnement vient d'expirer
    const expiredSubscriptions = await db.User.findAll({
      where: {
        role: 'revendeur',
        isActive: true,
        hasActiveSubscription: true,
        subscriptionEndDate: {
          [Op.lt]: now
        }
      }
    });

    for (const seller of expiredSubscriptions) {
      // Désactiver l'abonnement
      await seller.update({
        hasActiveSubscription: false
      });

      // Envoyer notification
      await NotificationService.notifySubscriptionExpired(seller.id);
      console.log(`✅ Notification expiration: ${seller.businessName}`);
    }

    console.log(`✅ ${expiredSubscriptions.length} notification(s) d'expiration envoyée(s)`);
  } catch (error) {
    console.error('❌ Erreur vérification expiration:', error);
  }
}, {
  scheduled: false
});

// ==========================================
// VÉRIFIER LES PÉRIODES DE GRÂCE
// Exécuté tous les jours à 12h
// ==========================================
const checkGracePeriods = cron.schedule('0 12 * * *', async () => {
  console.log('🔔 Vérification des périodes de grâce...');
  
  try {
    const now = new Date();

    // Trouver les revendeurs en période de grâce
    const sellersInGracePeriod = await db.User.findAll({
      where: {
        role: 'revendeur',
        isActive: true,
        gracePeriodEndDate: {
          [Op.gt]: now
        }
      }
    });

    for (const seller of sellersInGracePeriod) {
      const endDate = new Date(seller.gracePeriodEndDate);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Notifier à 5j, 3j et 1j
      if (daysRemaining === 5 || daysRemaining === 3 || daysRemaining === 1) {
        await NotificationService.notifyGracePeriod(
          seller.id,
          daysRemaining
        );
        console.log(`✅ Notification période de grâce: ${seller.businessName} (${daysRemaining}j)`);
      }
    }

    console.log(`✅ ${sellersInGracePeriod.length} notification(s) de période de grâce envoyée(s)`);
  } catch (error) {
    console.error('❌ Erreur vérification période de grâce:', error);
  }
}, {
  scheduled: false
});

// ==========================================
// NETTOYER LES NOTIFICATIONS EXPIRÉES
// Exécuté tous les jours à 3h du matin
// ==========================================
const cleanupNotifications = cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Nettoyage des notifications expirées...');
  
  try {
    await NotificationService.cleanupExpiredNotifications();
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur nettoyage notifications:', error);
  }
}, {
  scheduled: false
});

// ==========================================
// DÉMARRER TOUTES LES TÂCHES
// ==========================================
const startNotificationJobs = () => {
  console.log('🚀 Démarrage des tâches CRON de notifications...');
  
  checkExpiringSubscriptions.start();
  console.log('✅ Job: Vérification abonnements expirant (10h)');
  
  checkExpiredSubscriptions.start();
  console.log('✅ Job: Vérification abonnements expirés (1h)');
  
  checkGracePeriods.start();
  console.log('✅ Job: Vérification périodes de grâce (12h)');
  
  cleanupNotifications.start();
  console.log('✅ Job: Nettoyage notifications (3h)');
  
  console.log('✅ Toutes les tâches CRON de notifications sont actives');
};

// ==========================================
// ARRÊTER TOUTES LES TÂCHES
// ==========================================
const stopNotificationJobs = () => {
  checkExpiringSubscriptions.stop();
  checkExpiredSubscriptions.stop();
  checkGracePeriods.stop();
  cleanupNotifications.stop();
  console.log('⏸️ Tâches CRON de notifications arrêtées');
};

module.exports = {
  startNotificationJobs,
  stopNotificationJobs
};