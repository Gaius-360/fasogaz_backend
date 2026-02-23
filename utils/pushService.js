// ==========================================
// FICHIER: utils/pushService.js
// Envoie des notifications push via Web Push API (VAPID)
// ==========================================
const webpush = require('web-push');

// Configurer VAPID une seule fois au démarrage du serveur
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class PushService {

  static getDb() {
    return require('../models');
  }

  // ──────────────────────────────────────────────────────────
  // Envoyer un push à TOUS les appareils d'un utilisateur
  // ──────────────────────────────────────────────────────────
  static async sendToUser(userId, payload) {
    const db = this.getDb();

    const subscriptions = await db.PushSubscription.findAll({
      where: { userId, isActive: true },
    });

    if (!subscriptions.length) return;

    const payloadStr = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subscriptions.map((sub) => this._sendToOne(sub, payloadStr))
    );

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(
          `[Push] ❌ Échec envoi à ${subscriptions[i].endpoint.slice(0, 60)}…`,
          result.reason?.message || result.reason
        );
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // Envoyer à un abonnement spécifique (usage interne)
  // ──────────────────────────────────────────────────────────
  static async _sendToOne(subscription, payloadStr) {
    const pushConfig = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth:   subscription.auth,
      },
    };

    try {
      await webpush.sendNotification(pushConfig, payloadStr, {
        TTL: 86400, // Durée de vie max 24h si le device est hors ligne
      });

      // Mettre à jour lastUsedAt
      await subscription.update({ lastUsedAt: new Date() });

    } catch (error) {
      // 410 Gone / 404 = endpoint révoqué → désactiver proprement
      if (error.statusCode === 410 || error.statusCode === 404) {
        await subscription.update({ isActive: false });
        console.log(`[Push] Endpoint expiré désactivé: ${subscription.id}`);
      } else {
        throw error;
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // Construire le payload push depuis une notification BDD
  // ──────────────────────────────────────────────────────────
  static buildPayload(notification) {
    return {
      title:          notification.title,
      message:        notification.message,
      type:           notification.type,
      priority:       notification.priority,
      url:            notification.actionUrl || '/',
      notificationId: notification.id,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Nettoyage hebdomadaire des endpoints inactifs
  // ──────────────────────────────────────────────────────────
  static async cleanupInactiveSubscriptions() {
    const db = this.getDb();
    const { Op } = require('sequelize');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await db.PushSubscription.destroy({
      where: {
        [Op.or]: [
          { isActive: false },
          {
            isActive:   true,
            lastUsedAt: { [Op.lt]: thirtyDaysAgo },
          },
        ],
      },
    });

    if (deleted > 0) {
      console.log(`[Push] 🧹 ${deleted} abonnement(s) inactif(s) supprimé(s)`);
    }
  }
}

module.exports = PushService;