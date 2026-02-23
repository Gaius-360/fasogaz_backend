// ==========================================
// FICHIER: jobs/orderExpirationJob.js
// Job CRON pour gérer l'expiration des commandes
// ==========================================
const cron = require('node-cron');
const db = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('../utils/notificationService');

// Délai d'expiration en heures
const EXPIRATION_HOURS = 24;

// Seuils de rappel en heures avant expiration
const REMINDER_THRESHOLDS = [6, 2, 1]; // 6h, 2h, 1h avant expiration

/**
 * Vérifier et traiter les commandes expirées
 */
const checkExpiredOrders = async () => {
  try {
    console.log('🔍 Vérification des commandes expirées...');

    const now = new Date();
    const expirationTime = new Date(now.getTime() - EXPIRATION_HOURS * 60 * 60 * 1000);

    // Trouver toutes les commandes pending créées il y a plus de 24h
    const expiredOrders = await db.Order.findAll({
      where: {
        status: 'pending',
        createdAt: {
          [Op.lt]: expirationTime
        }
      },
      include: [
        {
          model: db.User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName', 'phone']
        }
      ]
    });

    if (expiredOrders.length === 0) {
      console.log('✅ Aucune commande expirée');
      return;
    }

    console.log(`⚠️ ${expiredOrders.length} commande(s) expirée(s) trouvée(s)`);

    // Traiter chaque commande expirée
    for (const order of expiredOrders) {
      try {
        await db.sequelize.transaction(async (transaction) => {
          // Mettre à jour le statut de la commande
          await order.update(
            {
              status: 'expired',
              rejectionReason: 'Le revendeur n\'a pas répondu dans les 24 heures'
            },
            { transaction }
          );

          console.log(`⏰ Commande expirée: ${order.orderNumber}`);
        });

        // Envoyer les notifications après la transaction
        setImmediate(async () => {
          try {
            // Notifier le client
            await NotificationService.notifyOrderExpired(order);

            // Notifier le revendeur de la pénalité
            await NotificationService.notifySellerOrderExpired(order);
          } catch (notifError) {
            console.error('❌ Erreur envoi notifications expiration:', notifError);
          }
        });
      } catch (error) {
        console.error(`❌ Erreur traitement commande ${order.orderNumber}:`, error);
      }
    }

    console.log(`✅ ${expiredOrders.length} commande(s) expirée(s) traitée(s)`);
  } catch (error) {
    console.error('❌ Erreur vérification commandes expirées:', error);
  }
};

/**
 * Envoyer des rappels aux revendeurs pour les commandes qui vont expirer
 */
const sendExpirationReminders = async () => {
  try {
    console.log('🔔 Envoi des rappels d\'expiration...');

    const now = new Date();

    // Vérifier pour chaque seuil de rappel
    for (const hoursBeforeExpiration of REMINDER_THRESHOLDS) {
      const targetTime = new Date(
        now.getTime() - (EXPIRATION_HOURS - hoursBeforeExpiration) * 60 * 60 * 1000
      );

      // Fenêtre de 5 minutes autour du seuil pour éviter les doublons
      const windowStart = new Date(targetTime.getTime() - 2.5 * 60 * 1000);
      const windowEnd = new Date(targetTime.getTime() + 2.5 * 60 * 1000);

      const ordersNeedingReminder = await db.Order.findAll({
        where: {
          status: 'pending',
          createdAt: {
            [Op.between]: [windowStart, windowEnd]
          }
        },
        include: [
          {
            model: db.User,
            as: 'seller',
            attributes: ['id', 'businessName', 'phone']
          }
        ]
      });

      if (ordersNeedingReminder.length > 0) {
        console.log(
          `⏰ ${ordersNeedingReminder.length} commande(s) à ${hoursBeforeExpiration}h de l'expiration`
        );

        for (const order of ordersNeedingReminder) {
          try {
            await NotificationService.notifyOrderExpiringWarning(
              order,
              hoursBeforeExpiration
            );
            console.log(
              `📧 Rappel envoyé pour commande ${order.orderNumber} (${hoursBeforeExpiration}h restantes)`
            );
          } catch (error) {
            console.error(`❌ Erreur envoi rappel ${order.orderNumber}:`, error);
          }
        }
      }
    }

    console.log('✅ Rappels d\'expiration traités');
  } catch (error) {
    console.error('❌ Erreur envoi rappels:', error);
  }
};

/**
 * Démarrer les jobs CRON
 */
const startOrderExpirationJobs = () => {
  console.log('🚀 Démarrage des jobs d\'expiration de commandes...');

  // Vérifier les commandes expirées toutes les heures
  cron.schedule('0 * * * *', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('⏰ CRON: Vérification des commandes expirées');
    console.log('='.repeat(60));
    await checkExpiredOrders();
  });

  // Envoyer des rappels toutes les 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🔔 CRON: Envoi des rappels d\'expiration');
    console.log('='.repeat(60));
    await sendExpirationReminders();
  });

  console.log('✅ Jobs d\'expiration de commandes démarrés');
  console.log('   - Vérification expiration: toutes les heures (0 * * * *)');
  console.log('   - Rappels: toutes les 30 minutes (*/30 * * * *)');
};

module.exports = {
  startOrderExpirationJobs,
  checkExpiredOrders,
  sendExpirationReminders,
  EXPIRATION_HOURS
};