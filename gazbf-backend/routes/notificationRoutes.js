// ==========================================
// FICHIER: routes/notificationRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Toutes les routes nécessitent authentification
router.use(protect);

// Obtenir mes notifications
router.get('/', notificationController.getMyNotifications);

// Compter les notifications non lues
router.get('/unread-count', notificationController.getUnreadCount);

// Marquer une notification comme lue
router.put('/:id/read', notificationController.markAsRead);

// Marquer toutes les notifications comme lues
router.put('/mark-all-read', notificationController.markAllAsRead);

// Supprimer une notification
router.delete('/:id', notificationController.deleteNotification);

// Supprimer toutes les notifications lues
router.delete('/clear-read', notificationController.clearReadNotifications);

module.exports = router;