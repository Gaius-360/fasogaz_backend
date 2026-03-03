// ==========================================
// FICHIER: utils/notificationService.js
// Service notifications — VERSION COMPLÈTE AVEC PUSH
// ==========================================
const PushService = require('./pushService');

// ── Helper interne ────────────────────────────────────────────
// Crée la notification en BDD ET envoie le push en séquence
async function createNotif(data) {
  const db = require('../models');
  const notification = await db.Notification.create(data);

  // ✅ FIX : await explicite au lieu de fire-and-forget
  // Le .catch() précédent absorbait silencieusement les erreurs sans garantir
  // que l'envoi avait eu lieu. Avec await, on s'assure que le push est tenté
  // avant de retourner, et les erreurs sont loguées proprement.
  try {
    await PushService.sendToUser(data.userId, PushService.buildPayload(notification));
  } catch (err) {
    console.error('[Push] Erreur envoi:', err);
    // On ne propage pas l'erreur — la notification BDD est créée,
    // le push est best-effort et ne doit pas faire échouer la transaction.
  }

  return notification;
}

class NotificationService {

  static getDb() { return require('../models'); }

  // ──────────────────────────────────────────────────────────
  // NOUVELLE COMMANDE REÇUE (Revendeur)
  // ──────────────────────────────────────────────────────────
  static async notifyNewOrder(order) {
    try {
      const db = this.getDb();
      const orderWithDetails = await db.Order.findByPk(order.id, {
        include: [
          { model: db.User,      as: 'customer', attributes: ['firstName', 'lastName', 'phone'] },
          { model: db.OrderItem, as: 'items',    include: [{ model: db.Product, as: 'product' }] },
        ],
      });

      const customerName = `${orderWithDetails.customer.firstName} ${orderWithDetails.customer.lastName}`;
      const itemsCount   = orderWithDetails.items.length;

      await createNotif({
        userId:    order.sellerId,
        type:      'new_order',
        title:     '🛒 Nouvelle commande reçue',
        message:   `${customerName} a passé une commande de ${itemsCount} produit(s) — ${parseFloat(order.total).toLocaleString()} FCFA`,
        data:      { orderId: order.id, orderNumber: order.orderNumber, customerId: order.customerId, customerName, total: order.total, itemsCount },
        priority:  'high',
        actionUrl: '/seller/orders',
      });

      console.log(`✅ [Notif] Nouvelle commande ${order.orderNumber}`);
    } catch (err) {
      console.error('❌ [Notif] notifyNewOrder:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // ALERTE STOCK FAIBLE / RUPTURE (Revendeur)
  // ──────────────────────────────────────────────────────────
  static async notifyStockAlert(product, previousQuantity) {
    try {
      const db = this.getDb();
      let title, message, priority;

      if (product.quantity === 0) {
        title    = '🚨 Rupture de stock';
        message  = `${product.brand} ${product.bottleType} est en rupture de stock`;
        priority = 'urgent';
      } else if (product.quantity <= 5) {
        title    = '⚠️ Stock faible';
        message  = `${product.brand} ${product.bottleType} — Il ne reste que ${product.quantity} unité(s)`;
        priority = 'high';
      } else {
        return;
      }

      const seller = await db.User.findByPk(product.sellerId);
      const now    = new Date();
      const hasActiveAccess =
        (seller.freeTrialEndDate    && new Date(seller.freeTrialEndDate)    > now) ||
        (seller.subscriptionEndDate && new Date(seller.subscriptionEndDate) > now && seller.hasActiveSubscription) ||
        (seller.gracePeriodEndDate  && new Date(seller.gracePeriodEndDate)  > now);

      if (!hasActiveAccess) return;

      await createNotif({
        userId:    product.sellerId,
        type:      'stock_alert',
        title,
        message,
        data:      { productId: product.id, brand: product.brand, bottleType: product.bottleType, quantity: product.quantity, previousQuantity },
        priority,
        actionUrl: '/seller/products',
      });

      console.log(`✅ [Notif] Stock ${product.brand} ${product.bottleType}`);
    } catch (err) {
      console.error('❌ [Notif] notifyStockAlert:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // COMMANDE ACCEPTÉE (Client)
  // ──────────────────────────────────────────────────────────
  static async notifyOrderAccepted(order) {
    try {
      await createNotif({
        userId:    order.customerId,
        type:      'order_accepted',
        title:     '✅ Commande acceptée',
        message:   `Votre commande ${order.orderNumber} a été acceptée par le revendeur`,
        data:      { orderId: order.id, orderNumber: order.orderNumber, estimatedTime: order.estimatedTime },
        priority:  'high',
        actionUrl: `/client/orders/${order.id}`,
      });
      console.log(`✅ [Notif] Commande acceptée ${order.orderNumber}`);
    } catch (err) {
      console.error('❌ [Notif] notifyOrderAccepted:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // COMMANDE REJETÉE (Client)
  // ──────────────────────────────────────────────────────────
  static async notifyOrderRejected(order) {
    try {
      await createNotif({
        userId:    order.customerId,
        type:      'order_rejected',
        title:     '❌ Commande rejetée',
        message:   `Votre commande ${order.orderNumber} a été rejetée. Raison : ${order.rejectionReason}`,
        data:      { orderId: order.id, orderNumber: order.orderNumber, rejectionReason: order.rejectionReason },
        priority:  'high',
        actionUrl: `/client/orders/${order.id}`,
      });
      console.log(`✅ [Notif] Commande rejetée ${order.orderNumber}`);
    } catch (err) {
      console.error('❌ [Notif] notifyOrderRejected:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // COMMANDE COMPLÉTÉE / LIVRÉE (Client)
  // ──────────────────────────────────────────────────────────
  static async notifyOrderCompleted(order) {
    try {
      await createNotif({
        userId:    order.customerId,
        type:      'order_completed',
        title:     '✅ Commande livrée',
        message:   `Votre commande ${order.orderNumber} a été livrée avec succès`,
        data:      { orderId: order.id, orderNumber: order.orderNumber },
        priority:  'medium',
        actionUrl: `/client/orders/${order.id}`,
      });
      console.log(`✅ [Notif] Commande complétée ${order.orderNumber}`);
    } catch (err) {
      console.error('❌ [Notif] notifyOrderCompleted:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // COMMANDE ANNULÉE PAR LE CLIENT (Revendeur)
  // ──────────────────────────────────────────────────────────
  static async notifyOrderCancelled(order) {
    try {
      await createNotif({
        userId:    order.sellerId,
        type:      'order_cancelled',
        title:     '⚠️ Commande annulée',
        message:   `La commande ${order.orderNumber} a été annulée par le client`,
        data:      { orderId: order.id, orderNumber: order.orderNumber },
        priority:  'medium',
        actionUrl: '/seller/orders',
      });
      console.log(`✅ [Notif] Commande annulée ${order.orderNumber}`);
    } catch (err) {
      console.error('❌ [Notif] notifyOrderCancelled:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // COMMANDE VA EXPIRER — RAPPEL REVENDEUR
  // ──────────────────────────────────────────────────────────
  static async notifyOrderExpiringWarning(order, hoursRemaining) {
    try {
      let title, priority;
      if (hoursRemaining <= 1) {
        title    = '🚨 URGENT : Commande expire dans 1h';
        priority = 'urgent';
      } else {
        title    = `⏰ Commande expire dans ${hoursRemaining}h`;
        priority = 'high';
      }

      await createNotif({
        userId:    order.sellerId,
        type:      'order_expiring_warning',
        title,
        message:   `La commande ${order.orderNumber} expire dans ${hoursRemaining} heure(s). Répondez maintenant pour éviter l'annulation automatique.`,
        data:      { orderId: order.id, orderNumber: order.orderNumber, hoursRemaining, expiresAt: order.expiresAt },
        priority,
        actionUrl: '/seller/orders',
      });
      console.log(`✅ [Notif] Commande expire bientôt ${order.orderNumber} (${hoursRemaining}h)`);
    } catch (err) {
      console.error('❌ [Notif] notifyOrderExpiringWarning:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // COMMANDE EXPIRÉE — CLIENT
  // ──────────────────────────────────────────────────────────
  static async notifyOrderExpired(order) {
    try {
      await createNotif({
        userId:    order.customerId,
        type:      'order_expired',
        title:     '⏰ Commande expirée',
        message:   `Votre commande ${order.orderNumber} a été annulée : le revendeur n'a pas répondu dans les 24h. Vous pouvez repasser commande.`,
        data:      { orderId: order.id, orderNumber: order.orderNumber, sellerName: order.seller?.businessName },
        priority:  'high',
        actionUrl: `/client/orders/${order.id}`,
      });
      console.log(`✅ [Notif] Commande expirée (client) ${order.orderNumber}`);
    } catch (err) {
      console.error('❌ [Notif] notifyOrderExpired:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // COMMANDE EXPIRÉE — REVENDEUR (pénalité)
  // ──────────────────────────────────────────────────────────
  static async notifySellerOrderExpired(order) {
    try {
      await createNotif({
        userId:    order.sellerId,
        type:      'seller_order_expired',
        title:     '⚠️ Commande expirée par délai',
        message:   `La commande ${order.orderNumber} a été annulée automatiquement faute de réponse dans les 24h. Cela peut affecter votre réputation.`,
        data:      { orderId: order.id, orderNumber: order.orderNumber, customerName: `${order.customer?.firstName} ${order.customer?.lastName}` },
        priority:  'high',
        actionUrl: '/seller/orders',
      });
      console.log(`✅ [Notif] Commande expirée (revendeur) ${order.orderNumber}`);
    } catch (err) {
      console.error('❌ [Notif] notifySellerOrderExpired:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // NOUVEL AVIS REÇU (Revendeur)
  // ──────────────────────────────────────────────────────────
  static async notifyNewReview(review) {
    try {
      const db = this.getDb();
      const reviewWithDetails = await db.Review.findByPk(review.id, {
        include: [
          { model: db.User,  as: 'customer', attributes: ['firstName', 'lastName'] },
          { model: db.Order, as: 'order',    attributes: ['orderNumber'] },
        ],
      });

      const customerName = `${reviewWithDetails.customer.firstName} ${reviewWithDetails.customer.lastName}`;
      const stars        = '⭐'.repeat(review.rating);

      await createNotif({
        userId:    review.sellerId,
        type:      'review_received',
        title:     '⭐ Nouvel avis reçu',
        message:   `${customerName} a laissé un avis ${stars} (${review.rating}/5)`,
        data:      { reviewId: review.id, orderId: review.orderId, orderNumber: reviewWithDetails.order.orderNumber, rating: review.rating, customerName },
        priority:  'medium',
        actionUrl: '/seller/reviews',
      });
      console.log(`✅ [Notif] Nouvel avis reçu`);
    } catch (err) {
      console.error('❌ [Notif] notifyNewReview:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // ABONNEMENT EXPIRE BIENTÔT (Revendeur)
  // ──────────────────────────────────────────────────────────
  static async notifySubscriptionExpiring(userId, daysRemaining, endDate) {
    try {
      await createNotif({
        userId,
        type:      'subscription_expiring',
        title:     '⚠️ Abonnement expire bientôt',
        message:   `Votre abonnement expire dans ${daysRemaining} jour(s). Renouvelez maintenant pour éviter toute interruption.`,
        data:      { daysRemaining, endDate },
        priority:  'high',
        actionUrl: '/seller/subscription',
      });
      console.log(`✅ [Notif] Abonnement expire bientôt (${daysRemaining}j)`);
    } catch (err) {
      console.error('❌ [Notif] notifySubscriptionExpiring:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // ABONNEMENT EXPIRÉ (Revendeur)
  // ──────────────────────────────────────────────────────────
  static async notifySubscriptionExpired(userId) {
    try {
      await createNotif({
        userId,
        type:      'subscription_expired',
        title:     '🚨 Abonnement expiré',
        message:   'Votre abonnement a expiré. Vous êtes en période de grâce. Renouvelez maintenant pour conserver votre visibilité.',
        data:      {},
        priority:  'urgent',
        actionUrl: '/seller/subscription',
      });
      console.log(`✅ [Notif] Abonnement expiré`);
    } catch (err) {
      console.error('❌ [Notif] notifySubscriptionExpired:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // PÉRIODE DE GRÂCE (Revendeur)
  // ──────────────────────────────────────────────────────────
  static async notifyGracePeriod(userId, daysRemaining) {
    try {
      await createNotif({
        userId,
        type:      'grace_period',
        title:     '⏰ Période de grâce active',
        message:   `Vous êtes en période de grâce (${daysRemaining}j restants). Renouvelez votre abonnement pour éviter la suspension.`,
        data:      { daysRemaining },
        priority:  'urgent',
        actionUrl: '/seller/subscription',
      });
      console.log(`✅ [Notif] Période de grâce (${daysRemaining}j)`);
    } catch (err) {
      console.error('❌ [Notif] notifyGracePeriod:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // MARQUER UNE NOTIFICATION COMME LUE
  // ──────────────────────────────────────────────────────────
  static async markAsRead(notificationId) {
    try {
      const db           = this.getDb();
      const notification = await db.Notification.findByPk(notificationId);
      if (notification && !notification.isRead) {
        await notification.update({ isRead: true, readAt: new Date() });
      }
    } catch (err) {
      console.error('❌ [Notif] markAsRead:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // MARQUER TOUTES LES NOTIFICATIONS COMME LUES
  // ──────────────────────────────────────────────────────────
  static async markAllAsRead(userId) {
    try {
      const db = this.getDb();
      await db.Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { userId, isRead: false } }
      );
    } catch (err) {
      console.error('❌ [Notif] markAllAsRead:', err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // NETTOYAGE DES NOTIFICATIONS EXPIRÉES
  // ──────────────────────────────────────────────────────────
  static async cleanupExpiredNotifications() {
    try {
      const db     = this.getDb();
      const { Op } = require('sequelize');

      const deleted = await db.Notification.destroy({
        where: { expiresAt: { [Op.lt]: new Date() } },
      });

      if (deleted > 0) {
        console.log(`✅ [Notif] ${deleted} notification(s) expirée(s) supprimée(s)`);
      }
    } catch (err) {
      console.error('❌ [Notif] cleanupExpiredNotifications:', err);
    }
  }
}

module.exports = NotificationService;