// ==========================================
// FICHIER: controllers/orderController.js
// ==========================================
const db = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Créer une commande
// @route   POST /api/orders
// @access  Private (client)
exports.createOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      sellerId,
      items, // [{ productId, quantity }]
      deliveryMode, // 'pickup' ou 'delivery'
      deliveryAddressId,
      customerNote
    } = req.body;

    // Validations
    if (!sellerId || !items || items.length === 0 || !deliveryMode) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Données manquantes', 400);
    }

    if (deliveryMode === 'delivery' && !deliveryAddressId) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Adresse de livraison requise', 400);
    }

    // Vérifier le revendeur
    const seller = await db.User.findByPk(sellerId);
    if (!seller || seller.role !== 'revendeur') {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    // Calculer le sous-total et vérifier les stocks
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await db.Product.findByPk(item.productId);
      
      if (!product) {
        await transaction.rollback();
        return ResponseHandler.error(res, `Produit ${item.productId} non trouvé`, 404);
      }

      if (product.sellerId !== sellerId) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          'Tous les produits doivent provenir du même revendeur',
          400
        );
      }

      if (product.quantity < item.quantity) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          `Stock insuffisant pour ${product.brand} ${product.bottleType}`,
          400
        );
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal
      });
    }

    // Frais de livraison
    let deliveryFee = 0;
    if (deliveryMode === 'delivery') {
      deliveryFee = seller.deliveryFee || 0;
    }

    const total = subtotal + deliveryFee;

    // Créer la commande
    const order = await db.Order.create({
      customerId: req.user.id,
      sellerId,
      deliveryAddressId: deliveryMode === 'delivery' ? deliveryAddressId : null,
      deliveryMode,
      subtotal,
      deliveryFee,
      total,
      customerNote,
      status: 'pending'
    }, { transaction });

    // Créer les items de commande
    for (const item of orderItems) {
      await db.OrderItem.create({
        orderId: order.id,
        ...item
      }, { transaction });
    }

    await transaction.commit();

    // Récupérer la commande complète
    const completeOrder = await db.Order.findByPk(order.id, {
      include: [
        {
          model: db.User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName', 'phone', 'quarter']
        },
        {
          model: db.Address,
          as: 'deliveryAddress'
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'bottleType', 'brand', 'productImage']
            }
          ]
        }
      ]
    });

    // TODO: Envoyer notification au revendeur

    return ResponseHandler.success(
      res,
      'Commande créée avec succès',
      completeOrder,
      201
    );
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur création commande:', error);
    return ResponseHandler.error(res, 'Erreur lors de la création', 500);
  }
};

// @desc    Obtenir mes commandes (client)
// @route   GET /api/orders/my-orders
// @access  Private (client)
exports.getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const where = { customerId: req.user.id };
    if (status) where.status = status;

    const orders = await db.Order.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName', 'phone', 'quarter', 'averageRating']
        },
        {
          model: db.Address,
          as: 'deliveryAddress'
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'bottleType', 'brand', 'productImage']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(
      res,
      'Vos commandes récupérées',
      orders
    );
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir les commandes reçues (revendeur)
// @route   GET /api/orders/received
// @access  Private (revendeur)
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
          model: db.Address,
          as: 'deliveryAddress'
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'bottleType', 'brand', 'productImage']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Statistiques
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      accepted: orders.filter(o => o.status === 'accepted').length,
      completed: orders.filter(o => o.status === 'completed').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total), 0)
    };

    return ResponseHandler.success(
      res,
      'Commandes reçues',
      {
        orders,
        stats
      }
    );
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir une commande par ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName', 'phone', 'quarter']
        },
        {
          model: db.Address,
          as: 'deliveryAddress'
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
      ]
    });

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    // Vérifier l'autorisation
    if (order.customerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'admin') {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    return ResponseHandler.success(res, 'Commande récupérée', order);
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Accepter une commande (revendeur)
// @route   PUT /api/orders/:id/accept
// @access  Private (revendeur)
exports.acceptOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { estimatedTime } = req.body; // en minutes

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.OrderItem,
          as: 'items',
          include: [{ model: db.Product, as: 'product' }]
        }
      ]
    });

    if (!order) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    if (order.sellerId !== req.user.id) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    if (order.status !== 'pending') {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Cette commande ne peut plus être acceptée', 400);
    }

    // Déduire les quantités du stock
    for (const item of order.items) {
      const product = item.product;
      
      if (product.quantity < item.quantity) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          `Stock insuffisant pour ${product.brand} ${product.bottleType}`,
          400
        );
      }

      await product.decrement('quantity', { 
        by: item.quantity,
        transaction 
      });
      
      await product.increment('orderCount', { 
        by: 1,
        transaction 
      });
    }

    // Mettre à jour la commande
    await order.update({
      status: 'accepted',
      acceptedAt: new Date(),
      estimatedTime: estimatedTime || null
    }, { transaction });

    await transaction.commit();

    // TODO: Envoyer notification au client

    const updatedOrder = await db.Order.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [{ model: db.Product, as: 'product' }]
        }
      ]
    });

    return ResponseHandler.success(res, 'Commande acceptée', updatedOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur acceptation commande:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'acceptation', 500);
  }
};

// @desc    Rejeter une commande (revendeur)
// @route   PUT /api/orders/:id/reject
// @access  Private (revendeur)
exports.rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return ResponseHandler.error(res, 'Raison de rejet requise', 400);
    }

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

    // TODO: Envoyer notification au client

    return ResponseHandler.success(res, 'Commande rejetée');
  } catch (error) {
    console.error('Erreur rejet commande:', error);
    return ResponseHandler.error(res, 'Erreur lors du rejet', 500);
  }
};

// @desc    Mettre à jour le statut de la commande
// @route   PUT /api/orders/:id/status
// @access  Private (revendeur)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['preparing', 'in_delivery', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return ResponseHandler.error(res, 'Statut invalide', 400);
    }

    const order = await db.Order.findByPk(id);

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    if (order.sellerId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    const updates = { status };
    
    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    await order.update(updates);

    // TODO: Envoyer notification au client

    return ResponseHandler.success(res, 'Statut mis à jour', order);
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// @desc    Annuler une commande (client)
// @route   PUT /api/orders/:id/cancel
// @access  Private (client)
exports.cancelOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.OrderItem,
          as: 'items',
          include: [{ model: db.Product, as: 'product' }]
        }
      ]
    });

    if (!order) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    if (order.customerId !== req.user.id) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    if (!['pending', 'accepted'].includes(order.status)) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Cette commande ne peut plus être annulée', 400);
    }

    // Si la commande était acceptée, remettre le stock
    if (order.status === 'accepted') {
      for (const item of order.items) {
        await item.product.increment('quantity', {
          by: item.quantity,
          transaction
        });
      }
    }

    await order.update({ status: 'cancelled' }, { transaction });

    await transaction.commit();

    // TODO: Envoyer notification au revendeur

    return ResponseHandler.success(res, 'Commande annulée');
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur annulation commande:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'annulation', 500);
  }
};

module.exports = exports;