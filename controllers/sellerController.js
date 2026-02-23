// ==========================================
// FICHIER: controllers/sellerController.js
// ==========================================

const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const { Op } = require('sequelize');

// @desc    Obtenir les statistiques du revendeur
// @route   GET /api/seller/stats
// @access  Private (revendeur)
exports.getStats = async (req, res) => {
  try {
    // Produits
    const products = await db.Product.findAll({
      where: { sellerId: req.user.id }
    });

    // Commandes
    const orders = await db.Order.findAll({
      where: { sellerId: req.user.id }
    });

    // Avis
    const reviews = await db.Review.findAll({
      where: { sellerId: req.user.id }
    });

    // Calculer les stats
    const stats = {
      products: {
        total: products.length,
        active: products.filter(p => p.isActive).length,
        totalStock: products.reduce((sum, p) => sum + p.quantity, 0),
        lowStock: products.filter(p => p.quantity <= 5).length
      },
      orders: {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        accepted: orders.filter(o => o.status === 'accepted').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        rejected: orders.filter(o => o.status === 'rejected').length
      },
      revenue: {
        total: orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + parseFloat(o.total), 0),
        thisMonth: orders
          .filter(o => {
            const orderDate = new Date(o.createdAt);
            const now = new Date();
            return o.status === 'completed' &&
              orderDate.getMonth() === now.getMonth() &&
              orderDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, o) => sum + parseFloat(o.total), 0),
        today: orders
          .filter(o => {
            const orderDate = new Date(o.createdAt);
            const today = new Date();
            return o.status === 'completed' &&
              orderDate.toDateString() === today.toDateString();
          })
          .reduce((sum, o) => sum + parseFloat(o.total), 0)
      },
      reviews: {
        total: reviews.length,
        average: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
        withResponse: reviews.filter(r => r.sellerResponse).length
      }
    };

    return ResponseHandler.success(
      res,
      'Statistiques récupérées',
      stats
    );
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir mes produits
// @route   GET /api/seller/products
// @access  Private (revendeur)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: { sellerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(
      res,
      'Produits récupérés',
      { products }
    );
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir les stats des produits
// @route   GET /api/seller/products/stats
// @access  Private (revendeur)
exports.getProductsStats = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: { sellerId: req.user.id }
    });

    const stats = {
      total: products.length,
      available: products.filter(p => p.status === 'available').length,
      limited: products.filter(p => p.status === 'limited').length,
      outOfStock: products.filter(p => p.status === 'out_of_stock').length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
      totalStock: products.reduce((sum, p) => sum + p.quantity, 0)
    };

    return ResponseHandler.success(res, 'Stats produits', stats);
  } catch (error) {
    console.error('Erreur stats produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir les commandes reçues
// @route   GET /api/seller/orders
// @access  Private (revendeur)
exports.getReceivedOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const where = { sellerId: req.user.id };
    if (status) {
      where.status = status;
    }

    const orders = await db.Order.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model: db.Address,
          as: 'deliveryAddress',
          required: false
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(
      res,
      'Commandes récupérées',
      { orders }
    );
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir les stats des commandes
// @route   GET /api/seller/orders/stats
// @access  Private (revendeur)
exports.getOrdersStats = async (req, res) => {
  try {
    const orders = await db.Order.findAll({
      where: { sellerId: req.user.id }
    });

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      accepted: orders.filter(o => o.status === 'accepted').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
      revenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total), 0)
    };

    return ResponseHandler.success(res, 'Stats commandes', stats);
  } catch (error) {
    console.error('Erreur stats commandes:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Accepter une commande
// @route   PUT /api/seller/orders/:id/accept
// @access  Private (revendeur)
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedTime } = req.body;

    const order = await db.Order.findOne({
      where: {
        id,
        sellerId: req.user.id
      }
    });

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    if (order.status !== 'pending') {
      return ResponseHandler.error(
        res,
        'Cette commande ne peut plus être acceptée',
        400
      );
    }

    await order.update({
      status: 'accepted',
      acceptedAt: new Date(),
      estimatedTime: estimatedTime || null
    });

    // Notifier le client
    await db.Notification.create({
      userId: order.customerId,
      type: 'order_accepted',
      title: 'Commande acceptée',
      message: `Votre commande ${order.orderNumber} a été acceptée`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber
      },
      priority: 'high',
      actionUrl: `/client/orders/${order.id}`
    });

    return ResponseHandler.success(
      res,
      'Commande acceptée',
      order
    );
  } catch (error) {
    console.error('Erreur acceptation commande:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'acceptation', 500);
  }
};

// @desc    Rejeter une commande
// @route   PUT /api/seller/orders/:id/reject
// @access  Private (revendeur)
exports.rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return ResponseHandler.error(
        res,
        'La raison du rejet est requise',
        400
      );
    }

    const order = await db.Order.findOne({
      where: {
        id,
        sellerId: req.user.id
      }
    });

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    if (order.status !== 'pending') {
      return ResponseHandler.error(
        res,
        'Cette commande ne peut plus être rejetée',
        400
      );
    }

    await order.update({
      status: 'rejected',
      rejectionReason: reason
    });

    // Notifier le client
    await db.Notification.create({
      userId: order.customerId,
      type: 'order_rejected',
      title: 'Commande rejetée',
      message: `Votre commande ${order.orderNumber} a été rejetée`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason
      },
      priority: 'high',
      actionUrl: `/client/orders/${order.id}`
    });

    return ResponseHandler.success(
      res,
      'Commande rejetée',
      order
    );
  } catch (error) {
    console.error('Erreur rejet commande:', error);
    return ResponseHandler.error(res, 'Erreur lors du rejet', 500);
  }
};

// @desc    Compléter une commande
// @route   PUT /api/seller/orders/:id/complete
// @access  Private (revendeur)
exports.completeOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.Order.findOne({
      where: {
        id,
        sellerId: req.user.id
      }
    });

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    if (order.status !== 'accepted' && order.status !== 'in_delivery') {
      return ResponseHandler.error(
        res,
        'Cette commande ne peut pas être complétée',
        400
      );
    }

    await order.update({
      status: 'completed',
      completedAt: new Date()
    });

    // Notifier le client
    await db.Notification.create({
      userId: order.customerId,
      type: 'order_completed',
      title: 'Commande complétée',
      message: `Votre commande ${order.orderNumber} a été livrée`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber
      },
      priority: 'medium',
      actionUrl: `/client/orders/${order.id}`
    });

    return ResponseHandler.success(
      res,
      'Commande complétée',
      order
    );
  } catch (error) {
    console.error('Erreur complétion commande:', error);
    return ResponseHandler.error(res, 'Erreur lors de la complétion', 500);
  }
};

// @desc    Obtenir les avis reçus
// @route   GET /api/seller/reviews
// @access  Private (revendeur)
exports.getReviews = async (req, res) => {
  try {
    const reviews = await db.Review.findAll({
      where: { sellerId: req.user.id },
      include: [
        {
          model: db.User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(
      res,
      'Avis récupérés',
      { reviews }
    );
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};


// @desc    Obtenir le profil du revendeur
// @route   GET /api/seller/profile
// @access  Private (revendeur)
exports.getProfile = async (req, res) => {
  try {
    const seller = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!seller) {
      return ResponseHandler.error(res, 'Utilisateur non trouvé', 404);
    }

    return ResponseHandler.success(
      res,
      'Profil récupéré',
      { seller }
    );
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};
