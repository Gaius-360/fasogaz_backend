const cron = require('node-cron');
const { checkExpiredSubscriptions } = require('../middleware/subscriptionMiddleware');

/**
 * Vérifier abonnements expirés - Tous les jours à 2h
 */
const checkExpiredTask = cron.schedule('0 2 * * *', async () => {
  console.log('🔄 [CRON] Vérification des abonnements...');
  await checkExpiredSubscriptions();
}, {
  scheduled: false,
  timezone: "Africa/Ouagadougou"
});

/**
 * Démarrer tous les jobs
 */
const startSubscriptionJobs = () => {
  console.log('🚀 Démarrage tâches CRON abonnement...');
  checkExpiredTask.start();
  console.log('✅ Tâches CRON démarrées');
};

/**
 * Arrêter tous les jobs
 */
const stopSubscriptionJobs = () => {
  console.log('⏹️ Arrêt tâches CRON...');
  checkExpiredTask.stop();
  console.log('✅ Tâches CRON arrêtées');
};

module.exports = {
  startSubscriptionJobs,
  stopSubscriptionJobs,
  checkExpiredSubscriptions
};