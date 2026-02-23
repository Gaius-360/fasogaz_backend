// ==========================================
// FICHIER: controllers/pushController.js
// Gestion des abonnements push utilisateurs
// ==========================================
const db              = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// @desc    S'abonner aux notifications push
// @route   POST /api/push/subscribe
// @access  Private
exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return ResponseHandler.error(res, 'Données d\'abonnement invalides (endpoint, p256dh, auth requis)', 400);
    }

    // Upsert : crée ou réactive l'abonnement pour cet endpoint
    const [subscription, created] = await db.PushSubscription.findOrCreate({
      where: { endpoint },
      defaults: {
        userId:    req.user.id,
        endpoint,
        p256dh:    keys.p256dh,
        auth:      keys.auth,
        userAgent: req.headers['user-agent']?.slice(0, 500) || null,
        isActive:  true,
      },
    });

    if (!created) {
      // Réactiver et mettre à jour les clés (peuvent changer si le navigateur est réinstallé)
      await subscription.update({
        userId:   req.user.id,
        p256dh:   keys.p256dh,
        auth:     keys.auth,
        isActive: true,
      });
    }

    console.log(`[Push] ✅ Abonnement ${created ? 'créé' : 'réactivé'} pour user ${req.user.id}`);

    return ResponseHandler.success(res, 'Abonnement push enregistré', {
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('❌ Erreur abonnement push:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Se désabonner des notifications push
// @route   DELETE /api/push/unsubscribe
// @access  Private
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return ResponseHandler.error(res, 'Endpoint manquant', 400);
    }

    await db.PushSubscription.update(
      { isActive: false },
      { where: { endpoint, userId: req.user.id } }
    );

    return ResponseHandler.success(res, 'Désabonnement effectué');

  } catch (error) {
    console.error('❌ Erreur désabonnement push:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Vérifier le statut d'abonnement push
// @route   GET /api/push/status
// @access  Private
exports.getStatus = async (req, res) => {
  try {
    const count = await db.PushSubscription.count({
      where: { userId: req.user.id, isActive: true },
    });

    return ResponseHandler.success(res, 'Statut push', {
      isSubscribed: count > 0,
      deviceCount:  count,
    });

  } catch (error) {
    return ResponseHandler.error(res, error.message, 500);
  }
};

module.exports = exports;