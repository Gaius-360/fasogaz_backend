const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// Obtenir les commandes reçues par le revendeur
exports.getReceivedOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = { sellerId: req.user.id };
    if (status) where.status = status;
    
    const orders = await db.Order.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
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
        },
        {
          model: db.Address,
          as: 'deliveryAddress'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const stats = {
      pending: orders.filter(o => o.status === 'pending').length,
      accepted: orders.filter(o => o.status === 'accepted').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      inDelivery: orders.filter(o => o.status === 'in_delivery').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
      totalRevenue: orders.filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total), 0)
    };
    
    return ResponseHandler.success(res, 'Commandes récupérées', {
      orders,
      stats
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// Accepter une commande
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedTime } = req.body;
    
    const order = await db.Order.findByPk(id);
    
    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }
    
    if (order.sellerId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }
    
    if (order.status !== 'pending') {
      return ResponseHandler.error(res, 'Cette commande ne peut plus être acceptée', 400);
    }
    
    await order.update({
      status: 'accepted',
      estimatedTime,
      acceptedAt: new Date()
    });
    
    return ResponseHandler.success(res, 'Commande acceptée', order);
  } catch (error) {
    console.error('Erreur acceptation commande:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'acceptation', 500);
  }
};

// Rejeter une commande
exports.rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const order = await db.Order.findByPk(id);
    
    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }
    
    if (order.sellerId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }
    
    if (order.status !== 'pending') {
      return ResponseHandler.error(res, 'Cette commande ne peut plus être rejetée', 400);
    }
    
    await order.update({
      status: 'rejected',
      rejectionReason
    });
    
    return ResponseHandler.success(res, 'Commande rejetée', order);
  } catch (error) {
    console.error('Erreur rejet commande:', error);
    return ResponseHandler.error(res, 'Erreur lors du rejet', 500);
  }
};

// Mettre à jour le statut
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await db.Order.findByPk(id);
    
    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }
    
    if (order.sellerId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }
    
    const validTransitions = {
      'accepted': ['preparing'],
      'preparing': ['in_delivery'],
      'in_delivery': ['completed']
    };
    
    if (!validTransitions[order.status]?.includes(status)) {
      return ResponseHandler.error(res, 'Transition de statut invalide', 400);
    }
    
    const updates = { status };
    if (status === 'completed') {
      updates.completedAt = new Date();
    }
    
    await order.update(updates);
    
    return ResponseHandler.success(res, 'Statut mis à jour', order);
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

module.exports = exports;