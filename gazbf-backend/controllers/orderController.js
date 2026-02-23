// ==========================================
// FICHIER: controllers/orderController.js - AVEC GESTION INTELLIGENTE DU STOCK + NOTIFICATIONS
// ✅ SIMPLIFIÉ: Suppression de l'état intermédiaire "preparing"
//
// FLUX RETRAIT SUR PLACE : pending → accepted → completed
// FLUX LIVRAISON         : pending → accepted → in_delivery → completed
// ==========================================
const db = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');
const NotificationService = require('../utils/notificationService');

// ✅ FONCTION HELPER POUR RETRAIT INTELLIGENT DU STOCK
const deductStockIntelligently = async (order, transaction) => {
  console.log('🔄 Déduction intelligente du stock pour commande:', order.orderNumber);

  for (const item of order.items) {
    const { productId, quantity } = item;
    const product = item.product;

    console.log(`📦 Traitement: ${product.brand} ${product.bottleType} x${quantity}`);

    const inventoryProduct = await db.Product.findOne({
      where: {
        sellerId: order.sellerId,
        bottleType: product.bottleType,
        brand: product.brand,
        isActive: true
      },
      transaction
    });

    if (!inventoryProduct) {
      throw new Error(
        `Produit non trouvé dans l'inventaire: ${product.brand} ${product.bottleType}`
      );
    }

    if (inventoryProduct.quantity < quantity) {
      throw new Error(
        `Stock insuffisant pour ${product.brand} ${product.bottleType}. ` +
        `Disponible: ${inventoryProduct.quantity}, Requis: ${quantity}`
      );
    }

    const oldQuantity = inventoryProduct.quantity;
    await inventoryProduct.decrement('quantity', {
      by: quantity,
      transaction
    });

    await inventoryProduct.reload({ transaction });
    
    console.log(
      `✅ Stock réduit: ${product.brand} ${product.bottleType} ` +
      `(${oldQuantity} → ${inventoryProduct.quantity})`
    );

    // Mise à jour du statut basé sur la nouvelle quantité
    let newStatus;
    if (inventoryProduct.quantity === 0) {
      newStatus = 'out_of_stock';
    } else if (inventoryProduct.quantity <= 5) {
      newStatus = 'limited';
    } else {
      newStatus = 'available';
    }

    if (inventoryProduct.status !== newStatus) {
      await inventoryProduct.update({ status: newStatus }, { transaction });
      console.log(`📊 Statut mis à jour: ${inventoryProduct.status} → ${newStatus}`);
    } else {
      console.log(`📊 Statut inchangé: ${inventoryProduct.status}`);
    }
  }

  console.log('✅ Déduction intelligente du stock terminée');
};

// @desc    Créer une commande
// @route   POST /api/orders
// @access  Private (client)
exports.createOrder = async (req, res) => {
  let transaction;
  
  try {
    transaction = await db.sequelize.transaction();
    
    const {
      sellerId,
      items,
      deliveryMode,
      deliveryAddressId,
      customerNote
    } = req.body;

    // Validations
    if (!sellerId) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'ID du revendeur requis', 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Aucun produit dans la commande', 400);
    }

    if (!deliveryMode || !['pickup', 'delivery'].includes(deliveryMode)) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Mode de livraison invalide', 400);
    }

    if (deliveryMode === 'delivery' && !deliveryAddressId) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Adresse de livraison requise', 400);
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'Données de produit invalides', 400);
      }
    }

    // Vérifier le revendeur
    const seller = await db.User.findByPk(sellerId);
    if (!seller || seller.role !== 'revendeur') {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    // Vérifier l'adresse de livraison si nécessaire
    if (deliveryMode === 'delivery') {
      const address = await db.Address.findOne({
        where: {
          id: deliveryAddressId,
          userId: req.user.id
        }
      });

      if (!address) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'Adresse de livraison invalide', 404);
      }
    }

    // Calculer le sous-total et vérifier la disponibilité
    let subtotal = 0;
    const orderItems = [];
    const productIds = items.map(item => item.productId);

    const products = await db.Product.findAll({
      where: {
        id: { [Op.in]: productIds }
      }
    });

    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    for (const item of items) {
      const product = productMap[item.productId];
      
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

      // Vérification de disponibilité (pas de déduction ici)
      const inventoryProduct = await db.Product.findOne({
        where: {
          sellerId,
          bottleType: product.bottleType,
          brand: product.brand,
          isActive: true
        },
        transaction
      });

      if (!inventoryProduct || inventoryProduct.quantity < item.quantity) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          `Stock insuffisant pour ${product.brand} ${product.bottleType}. ` +
          `Disponible: ${inventoryProduct?.quantity || 0}`,
          400
        );
      }

      const itemSubtotal = parseFloat(product.price) * parseInt(item.quantity);
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        quantity: parseInt(item.quantity),
        price: parseFloat(product.price),
        subtotal: itemSubtotal
      });

      await product.increment('orderCount', { by: 1, transaction });
    }

    // Frais de livraison
    let deliveryFee = 0;
    if (deliveryMode === 'delivery') {
      deliveryFee = parseFloat(seller.deliveryFee) || 0;
    }

    const total = subtotal + deliveryFee;

    // Créer la commande
    const order = await db.Order.create({
      customerId: req.user.id,
      sellerId,
      deliveryAddressId: deliveryMode === 'delivery' ? deliveryAddressId : null,
      deliveryMode,
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      customerNote: customerNote || null,
      status: 'pending'
    }, { transaction });

    for (const item of orderItems) {
      await db.OrderItem.create({ orderId: order.id, ...item }, { transaction });
    }

    await transaction.commit();
    console.log(`✅ Commande créée: ${order.orderNumber}`);

    // Notification après commit
    setImmediate(async () => {
      try {
        await NotificationService.notifyNewOrder(order);
      } catch (error) {
        console.error('❌ Erreur notification nouvelle commande:', error);
      }
    });

    // Récupérer la commande complète
    const completeOrder = await db.Order.findByPk(order.id, {
      include: [
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: db.User, as: 'seller', attributes: ['id', 'businessName', 'phone', 'quarter'] },
        { model: db.Address, as: 'deliveryAddress' },
        {
          model: db.OrderItem, as: 'items',
          include: [{ model: db.Product, as: 'product', attributes: ['id', 'bottleType', 'brand', 'productImage'] }]
        }
      ]
    });

    return ResponseHandler.success(res, 'Commande créée avec succès', completeOrder, 201);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Erreur création commande:', error);
    return ResponseHandler.error(res, `Erreur lors de la création: ${error.message}`, 500);
  }
};

// @desc    Accepter une commande (revendeur)
// @route   PUT /api/orders/:id/accept
// @access  Private (revendeur)
exports.acceptOrder = async (req, res) => {
  let transaction;
  
  try {
    transaction = await db.sequelize.transaction();
    
    const { id } = req.params;
    const { estimatedTime } = req.body;

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.OrderItem, as: 'items',
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

    // Vérification finale du stock avant acceptation
    for (const item of order.items) {
      const inventoryProduct = await db.Product.findOne({
        where: {
          sellerId: order.sellerId,
          bottleType: item.product.bottleType,
          brand: item.product.brand,
          isActive: true
        },
        transaction
      });

      if (!inventoryProduct || inventoryProduct.quantity < item.quantity) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          `Stock insuffisant pour ${item.product.brand} ${item.product.bottleType}`,
          400
        );
      }
    }

    await order.update({
      status: 'accepted',
      acceptedAt: new Date(),
      estimatedTime: estimatedTime || null
    }, { transaction });

    await transaction.commit();
    console.log(`✅ Commande acceptée: ${order.orderNumber}`);

    setImmediate(async () => {
      try {
        await NotificationService.notifyOrderAccepted(order);
      } catch (error) {
        console.error('❌ Erreur notification acceptation:', error);
      }
    });

    const updatedOrder = await db.Order.findByPk(id, {
      include: [
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        {
          model: db.OrderItem, as: 'items',
          include: [{ model: db.Product, as: 'product' }]
        }
      ]
    });

    return ResponseHandler.success(res, 'Commande acceptée', updatedOrder);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Erreur acceptation commande:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Rejeter une commande (revendeur)
// @route   PUT /api/orders/:id/reject
// @access  Private (revendeur)
exports.rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
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
      rejectionReason: rejectionReason.trim()
    });

    console.log(`✅ Commande rejetée: ${order.orderNumber}`);

    setImmediate(async () => {
      try {
        await NotificationService.notifyOrderRejected(order);
      } catch (error) {
        console.error('❌ Erreur notification rejet:', error);
      }
    });

    return ResponseHandler.success(res, 'Commande rejetée');
  } catch (error) {
    console.error('❌ Erreur rejet commande:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Compléter une commande - AVEC DÉDUCTION INTELLIGENTE DU STOCK
// @route   PUT /api/orders/:id/complete
// @access  Private (revendeur)
// ✅ SIMPLIFIÉ: Accepte la transition depuis `accepted` (pickup) ou `in_delivery` (delivery)
exports.completeOrder = async (req, res) => {
  let transaction;
  
  try {
    transaction = await db.sequelize.transaction();
    
    const { id } = req.params;

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.OrderItem, as: 'items',
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

    // ✅ TRANSITIONS VALIDES :
    //   - pickup    : accepted → completed
    //   - delivery  : in_delivery → completed
    const validPreviousStatuses = order.deliveryMode === 'pickup'
      ? ['accepted']
      : ['in_delivery'];

    if (!validPreviousStatuses.includes(order.status)) {
      await transaction.rollback();
      return ResponseHandler.error(
        res,
        order.deliveryMode === 'pickup'
          ? 'Une commande de retrait doit être acceptée avant d\'être complétée'
          : 'Une commande de livraison doit être en livraison avant d\'être complétée',
        400
      );
    }

    // Déduction intelligente du stock à la complétion
    await deductStockIntelligently(order, transaction);

    await order.update({
      status: 'completed',
      completedAt: new Date()
    }, { transaction });

    await transaction.commit();
    console.log(`✅ Commande complétée avec déduction de stock: ${order.orderNumber}`);

    setImmediate(async () => {
      try {
        await NotificationService.notifyOrderCompleted(order);
      } catch (error) {
        console.error('❌ Erreur notification complétion:', error);
      }
    });

    const completedOrder = await db.Order.findByPk(id, {
      include: [
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        {
          model: db.OrderItem, as: 'items',
          include: [{ model: db.Product, as: 'product' }]
        }
      ]
    });

    return ResponseHandler.success(res, 'Commande complétée avec succès', completedOrder);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Erreur complétion commande:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Mettre à jour le statut de la commande
// @route   PUT /api/orders/:id/status
// @access  Private (revendeur)
// ✅ SIMPLIFIÉ: Seuls `in_delivery` et `completed` sont des statuts valides via cet endpoint.
//    - `in_delivery` : uniquement depuis `accepted` ET uniquement pour les commandes de livraison
//    - `completed`   : délégué à la logique de completeOrder (pickup depuis accepted, delivery depuis in_delivery)
exports.updateOrderStatus = async (req, res) => {
  let transaction;
  
  try {
    transaction = await db.sequelize.transaction();
    
    const { id } = req.params;
    const { status } = req.body;

    // ✅ Seuls ces deux statuts sont acceptés via cet endpoint
    const validStatuses = ['in_delivery', 'completed'];
    
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Statut invalide. Valeurs acceptées : in_delivery, completed', 400);
    }

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.OrderItem, as: 'items',
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

    const updates = { status };

    // ✅ VALIDATION DES TRANSITIONS
    if (status === 'in_delivery') {
      // in_delivery n'est valide que pour les livraisons, depuis accepted
      if (order.deliveryMode !== 'delivery') {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          'Le statut "en livraison" n\'est applicable qu\'aux commandes de livraison',
          400
        );
      }
      if (order.status !== 'accepted') {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          'La commande doit être acceptée avant de partir en livraison',
          400
        );
      }
    }

    if (status === 'completed') {
      // Réutiliser la même logique de validation que completeOrder
      const validPreviousStatuses = order.deliveryMode === 'pickup'
        ? ['accepted']
        : ['in_delivery'];

      if (!validPreviousStatuses.includes(order.status)) {
        await transaction.rollback();
        return ResponseHandler.error(
          res,
          order.deliveryMode === 'pickup'
            ? 'Une commande de retrait doit être acceptée avant d\'être complétée'
            : 'Une commande de livraison doit être en livraison avant d\'être complétée',
          400
        );
      }

      // Déduction du stock à la complétion
      await deductStockIntelligently(order, transaction);
      updates.completedAt = new Date();
    }

    await order.update(updates, { transaction });

    await transaction.commit();
    console.log(`✅ Statut mis à jour: ${order.orderNumber} → ${status}`);

    if (status === 'completed') {
      setImmediate(async () => {
        try {
          await NotificationService.notifyOrderCompleted(order);
        } catch (error) {
          console.error('❌ Erreur notification complétion:', error);
        }
      });
    }

    const updatedOrder = await db.Order.findByPk(id, {
      include: [
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        {
          model: db.OrderItem, as: 'items',
          include: [{ model: db.Product, as: 'product' }]
        }
      ]
    });

    return ResponseHandler.success(res, 'Statut mis à jour', updatedOrder);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Erreur mise à jour statut:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

// @desc    Annuler une commande (client)
// @route   PUT /api/orders/:id/cancel
// @access  Private (client)
exports.cancelOrder = async (req, res) => {
  let transaction;
  
  try {
    transaction = await db.sequelize.transaction();
    
    const { id } = req.params;

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.OrderItem, as: 'items',
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

    // Pas de remise en stock : le stock n'est déduit qu'à la complétion
    await order.update({ status: 'cancelled' }, { transaction });

    await transaction.commit();
    console.log(`✅ Commande annulée: ${order.orderNumber}`);

    setImmediate(async () => {
      try {
        await NotificationService.notifyOrderCancelled(order);
      } catch (error) {
        console.error('❌ Erreur notification annulation:', error);
      }
    });

    return ResponseHandler.success(res, 'Commande annulée');
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Erreur annulation commande:', error);
    return ResponseHandler.error(res, error.message, 500);
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
        { model: db.User, as: 'seller', attributes: ['id', 'businessName', 'phone', 'quarter', 'averageRating'] },
        { model: db.Address, as: 'deliveryAddress' },
        {
          model: db.OrderItem, as: 'items',
          include: [{ model: db.Product, as: 'product', attributes: ['id', 'bottleType', 'brand', 'productImage'] }]
        },
        { model: db.Review, as: 'review', required: false }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(res, 'Vos commandes récupérées', orders);
  } catch (error) {
    console.error('❌ Erreur récupération commandes:', error);
    return ResponseHandler.error(res, error.message, 500);
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
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: db.Address, as: 'deliveryAddress' },
        {
          model: db.OrderItem, as: 'items',
          include: [{ model: db.Product, as: 'product', attributes: ['id', 'bottleType', 'brand', 'productImage'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      accepted: orders.filter(o => o.status === 'accepted').length,
      in_delivery: orders.filter(o => o.status === 'in_delivery').length,
      completed: orders.filter(o => o.status === 'completed').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total), 0)
    };

    return ResponseHandler.success(res, 'Commandes reçues', { orders, stats });
  } catch (error) {
    console.error('❌ Erreur récupération commandes:', error);
    return ResponseHandler.error(res, error.message, 500);
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
        { model: db.User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: db.User, as: 'seller', attributes: ['id', 'businessName', 'phone', 'quarter'] },
        { model: db.Address, as: 'deliveryAddress' },
        {
          model: db.OrderItem, as: 'items',
          include: [{ model: db.Product, as: 'product' }]
        }
      ]
    });

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    if (order.customerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'admin') {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    return ResponseHandler.success(res, 'Commande récupérée', order);
  } catch (error) {
    console.error('❌ Erreur récupération commande:', error);
    return ResponseHandler.error(res, error.message, 500);
  }
};

module.exports = exports;