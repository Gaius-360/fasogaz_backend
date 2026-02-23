// ==========================================
// FICHIER: controllers/notificationController.js
// ==========================================
const db = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');
const NotificationService = require('../utils/notificationService');

// @desc    Obtenir mes notifications
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      unreadOnly = false,
      type 
    } = req.query;

    const where = { userId: req.user.id };
    
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    const notifications = await db.Notification.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['priority', 'DESC'], // Notifications urgentes en premier
        ['createdAt', 'DESC']
      ]
    });

    // Compter les non-lues
    const unreadCount = await db.Notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    return ResponseHandler.success(
      res,
      'Notifications récupérées',
      {
        notifications,
        unreadCount,
        total: await db.Notification.count({ where: { userId: req.user.id } })
      }
    );
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Compter les notifications non lues
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await db.Notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    return ResponseHandler.success(
      res,
      'Nombre de notifications non lues',
      { unreadCount }
    );
  } catch (error) {
    console.error('❌ Erreur comptage notifications:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Marquer une notification comme lue
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await db.Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return ResponseHandler.error(res, 'Notification non trouvée', 404);
    }

    if (!notification.isRead) {
      await notification.update({
        isRead: true,
        readAt: new Date()
      });
    }

    return ResponseHandler.success(
      res,
      'Notification marquée comme lue',
      notification
    );
  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Marquer toutes les notifications comme lues
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);

    return ResponseHandler.success(
      res,
      'Toutes les notifications ont été marquées comme lues'
    );
  } catch (error) {
    console.error('❌ Erreur marquage notifications:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Supprimer une notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await db.Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return ResponseHandler.error(res, 'Notification non trouvée', 404);
    }

    await notification.destroy();

    return ResponseHandler.success(
      res,
      'Notification supprimée'
    );
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Supprimer toutes les notifications lues
// @route   DELETE /api/notifications/clear-read
// @access  Private
exports.clearReadNotifications = async (req, res) => {
  try {
    const deleted = await db.Notification.destroy({
      where: {
        userId: req.user.id,
        isRead: true
      }
    });

    return ResponseHandler.success(
      res,
      `${deleted} notification(s) supprimée(s)`
    );
  } catch (error) {
    console.error('❌ Erreur suppression notifications:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

module.exports = exports;