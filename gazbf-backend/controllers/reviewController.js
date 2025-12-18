// ==========================================
// FICHIER: controllers/reviewController.js
// ==========================================
const db = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Créer un avis (après commande complétée)
// @route   POST /api/reviews
// @access  Private (client)
exports.createReview = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { orderId, rating, comment } = req.body;

    // Validations
    if (!orderId || !rating) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Commande et note requises', 400);
    }

    if (rating < 1 || rating > 5) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'La note doit être entre 1 et 5', 400);
    }

    // Vérifier que la commande existe
    const order = await db.Order.findByPk(orderId);

    if (!order) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    // Vérifier que c'est bien le client de la commande
    if (order.customerId !== req.user.id) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    // Vérifier que la commande est complétée
    if (order.status !== 'completed') {
      await transaction.rollback();
      return ResponseHandler.error(
        res,
        'Vous pouvez laisser un avis uniquement après réception de la commande',
        400
      );
    }

    // Vérifier qu'un avis n'existe pas déjà pour cette commande
    const existingReview = await db.Review.findOne({
      where: { orderId }
    });

    if (existingReview) {
      await transaction.rollback();
      return ResponseHandler.error(
        res,
        'Vous avez déjà laissé un avis pour cette commande',
        400
      );
    }

    // Créer l'avis
    const review = await db.Review.create({
      orderId,
      customerId: req.user.id,
      sellerId: order.sellerId,
      rating,
      comment: comment || null
    }, { transaction });

    // Mettre à jour la note moyenne et le nombre d'avis du revendeur
    const seller = await db.User.findByPk(order.sellerId);
    
    const allReviews = await db.Review.findAll({
      where: { sellerId: order.sellerId }
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / allReviews.length).toFixed(2);

    await seller.update({
      averageRating,
      totalReviews: allReviews.length
    }, { transaction });

    await transaction.commit();

    return ResponseHandler.success(
      res,
      'Avis publié avec succès',
      review,
      201
    );
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur création avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la création', 500);
  }
};

// @desc    Obtenir les avis d'un revendeur
// @route   GET /api/reviews/seller/:sellerId
// @access  Public
exports.getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { rating, limit = 10, offset = 0 } = req.query;

    const where = { sellerId };
    if (rating) where.rating = rating;

    const reviews = await db.Review.findAndCountAll({
      where,
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
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Statistiques des avis
    const allReviews = await db.Review.findAll({
      where: { sellerId },
      attributes: ['rating']
    });

    const stats = {
      total: allReviews.length,
      average: allReviews.length > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(2)
        : 0,
      distribution: {
        5: allReviews.filter(r => r.rating === 5).length,
        4: allReviews.filter(r => r.rating === 4).length,
        3: allReviews.filter(r => r.rating === 3).length,
        2: allReviews.filter(r => r.rating === 2).length,
        1: allReviews.filter(r => r.rating === 1).length
      }
    };

    return ResponseHandler.success(
      res,
      'Avis récupérés',
      {
        reviews: reviews.rows,
        total: reviews.count,
        stats
      }
    );
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir mes avis donnés (client)
// @route   GET /api/reviews/my-reviews
// @access  Private (client)
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await db.Review.findAll({
      where: { customerId: req.user.id },
      include: [
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName']
        },
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(
      res,
      'Vos avis récupérés',
      reviews
    );
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir les avis reçus (revendeur)
// @route   GET /api/reviews/received
// @access  Private (revendeur)
exports.getReceivedReviews = async (req, res) => {
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
          attributes: ['id', 'orderNumber', 'total']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Statistiques
    const stats = {
      total: reviews.length,
      average: reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
        : 0,
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      }
    };

    return ResponseHandler.success(
      res,
      'Avis reçus',
      {
        reviews,
        stats
      }
    );
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Mettre à jour un avis
// @route   PUT /api/reviews/:id
// @access  Private (client)
exports.updateReview = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await db.Review.findByPk(id);

    if (!review) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Avis non trouvé', 404);
    }

    // Vérifier que c'est bien l'auteur de l'avis
    if (review.customerId !== req.user.id) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    // Valider la note
    if (rating && (rating < 1 || rating > 5)) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'La note doit être entre 1 et 5', 400);
    }

    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment;

    await review.update(updates, { transaction });

    // Recalculer la moyenne du revendeur
    const allReviews = await db.Review.findAll({
      where: { sellerId: review.sellerId }
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / allReviews.length).toFixed(2);

    await db.User.update(
      { averageRating },
      { 
        where: { id: review.sellerId },
        transaction 
      }
    );

    await transaction.commit();

    return ResponseHandler.success(res, 'Avis mis à jour', review);
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur mise à jour avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// @desc    Supprimer un avis
// @route   DELETE /api/reviews/:id
// @access  Private (client ou admin)
exports.deleteReview = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    const review = await db.Review.findByPk(id);

    if (!review) {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Avis non trouvé', 404);
    }

    // Vérifier l'autorisation
    if (review.customerId !== req.user.id && req.user.role !== 'admin') {
      await transaction.rollback();
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    const sellerId = review.sellerId;

    await review.destroy({ transaction });

    // Recalculer la moyenne du revendeur
    const allReviews = await db.Review.findAll({
      where: { sellerId }
    });

    const averageRating = allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(2)
      : 0;

    await db.User.update(
      { 
        averageRating,
        totalReviews: allReviews.length
      },
      { 
        where: { id: sellerId },
        transaction 
      }
    );

    await transaction.commit();

    return ResponseHandler.success(res, 'Avis supprimé');
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur suppression avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// @desc    Signaler un avis
// @route   POST /api/reviews/:id/report
// @access  Private
exports.reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return ResponseHandler.error(res, 'Raison du signalement requise', 400);
    }

    const review = await db.Review.findByPk(id);

    if (!review) {
      return ResponseHandler.error(res, 'Avis non trouvé', 404);
    }

    // TODO: Implémenter un système de signalement dans une table dédiée
    // Pour l'instant, on log simplement
    console.log(`⚠️ Avis ${id} signalé par ${req.user.id} pour: ${reason}`);

    return ResponseHandler.success(
      res,
      'Avis signalé. Notre équipe va l\'examiner.'
    );
  } catch (error) {
    console.error('Erreur signalement avis:', error);
    return ResponseHandler.error(res, 'Erreur lors du signalement', 500);
  }
};

module.exports = exports;