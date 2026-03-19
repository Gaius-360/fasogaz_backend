// ==========================================
// FICHIER: controllers/reviewController.js
// ✅ NOUVEAU: Validation contenu inapproprié (commentaire + réponse)
//            via utils/contentFilter.js
// ✅ NOUVEAU: getSellerReviews n'expose plus l'id client (anonymisation)
//            getReceivedReviews conserve id + phone (usage interne revendeur)
// ==========================================

const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const { Op } = require('sequelize');
const { validateUserText } = require('../utils/contentFilter');

// @desc    Créer un avis
// @route   POST /api/reviews
// @access  Private (client)
exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) {
      return ResponseHandler.error(res, 'Commande et note requis', 400);
    }

    if (rating < 1 || rating > 5) {
      return ResponseHandler.error(res, 'La note doit être entre 1 et 5', 400);
    }

    // ✅ Validation du contenu du commentaire
    if (comment) {
      const check = validateUserText(comment, 'Le commentaire');
      if (!check.valid) {
        return ResponseHandler.error(res, check.message, 422);
      }
    }

    // Vérifier que la commande existe et appartient au client
    const order = await db.Order.findOne({
      where: { id: orderId, customerId: req.user.id }
    });

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    // Vérifier que la commande est complétée
    if (order.status !== 'completed') {
      return ResponseHandler.error(
        res,
        'Vous ne pouvez noter que les commandes complétées',
        400
      );
    }

    // Vérifier qu'un avis n'existe pas déjà
    const existingReview = await db.Review.findOne({ where: { orderId } });
    if (existingReview) {
      return ResponseHandler.error(res, 'Vous avez déjà noté cette commande', 409);
    }

    const review = await db.Review.create({
      orderId,
      customerId: req.user.id,
      sellerId:   order.sellerId,
      rating,
      comment:    comment || null
    });

    await updateSellerRating(order.sellerId);

    await db.Notification.create({
      userId:    order.sellerId,
      type:      'review_received',
      title:     'Nouvel avis reçu',
      message:   `Vous avez reçu une note de ${rating}/5 étoiles`,
      data:      { reviewId: review.id, orderId: order.id, rating },
      priority:  'medium',
      actionUrl: '/seller/reviews'
    });

    return ResponseHandler.success(res, 'Avis créé avec succès', review, 201);
  } catch (error) {
    console.error('Erreur création avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la création', 500);
  }
};

// @desc    Obtenir mes avis (client)
// @route   GET /api/reviews/my-reviews
// @access  Private (client)
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await db.Review.findAll({
      where: { customerId: req.user.id },
      include: [
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'createdAt']
        },
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(res, 'Avis récupérés', reviews);
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir les avis d'un revendeur (vue publique)
// @route   GET /api/reviews/seller/:sellerId
// @access  Public
exports.getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: reviews } = await db.Review.findAndCountAll({
      where: { sellerId },
      include: [
        {
          model: db.User,
          as: 'customer',
          // ✅ Pas d'id ni d'email exposé sur la route publique.
          //    Le frontend anonymise avec prénom + initiale du nom.
          attributes: ['firstName', 'lastName']
        },
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset
    });

    // Stats de distribution des notes
    const allReviews = await db.Review.findAll({
      where:      { sellerId },
      attributes: ['rating']
    });

    const stats = {
      total:   allReviews.length,
      average: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0,
      distribution: {
        5: allReviews.filter(r => r.rating === 5).length,
        4: allReviews.filter(r => r.rating === 4).length,
        3: allReviews.filter(r => r.rating === 3).length,
        2: allReviews.filter(r => r.rating === 2).length,
        1: allReviews.filter(r => r.rating === 1).length,
      }
    };

    return ResponseHandler.success(res, 'Avis récupérés', {
      reviews,
      stats,
      pagination: {
        currentPage:  parseInt(page),
        totalPages:   Math.ceil(count / parseInt(limit)),
        totalItems:   count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération avis revendeur:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir les avis reçus (revendeur — usage interne)
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
          // Usage interne revendeur : id + prénom + nom + téléphone
          // pour identification si litige.
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total:           reviews.length,
      average:         reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
      withResponse:    reviews.filter(r =>  r.sellerResponse).length,
      withoutResponse: reviews.filter(r => !r.sellerResponse).length
    };

    return ResponseHandler.success(
      res,
      'Avis reçus récupérés',
      { reviews, stats }
    );
  } catch (error) {
    console.error('Erreur récupération avis reçus:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Répondre à un avis
// @route   PUT /api/reviews/:id/respond
// @access  Private (revendeur)
exports.respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim() === '') {
      return ResponseHandler.error(res, 'La réponse ne peut pas être vide', 400);
    }

    // ✅ Validation du contenu de la réponse
    const check = validateUserText(response, 'La réponse');
    if (!check.valid) {
      return ResponseHandler.error(res, check.message, 422);
    }

    const review = await db.Review.findOne({
      where: { id, sellerId: req.user.id }
    });

    if (!review) {
      return ResponseHandler.error(res, 'Avis non trouvé', 404);
    }

    if (review.sellerResponse) {
      return ResponseHandler.error(res, 'Vous avez déjà répondu à cet avis', 400);
    }

    await review.update({
      sellerResponse: response.trim(),
      respondedAt:    new Date()
    });

    await db.Notification.create({
      userId:    review.customerId,
      type:      'review_response',
      title:     'Réponse à votre avis',
      message:   'Le revendeur a répondu à votre avis',
      data:      { reviewId: review.id },
      priority:  'low',
      actionUrl: '/client/reviews'
    });

    return ResponseHandler.success(res, 'Réponse ajoutée avec succès', review);
  } catch (error) {
    console.error('Erreur réponse avis:', error);
    return ResponseHandler.error(res, 'Erreur lors de la réponse', 500);
  }
};

// ── Helper interne ─────────────────────────────────────────────────────────

async function updateSellerRating(sellerId) {
  try {
    const reviews = await db.Review.findAll({
      where:      { sellerId },
      attributes: ['rating']
    });

    const count   = reviews.length;
    const average = count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    // ✅ FIX: mise à jour des deux champs pour compatibilité.
    //   - totalReviews  : champ historique
    //   - reviewCount   : champ lu par le frontend (SellerDetailsModal, carte revendeur, etc.)
    //   - averageRating : note moyenne affichée dans le header du modal
    await db.User.update(
      {
        averageRating: parseFloat(average.toFixed(2)),
        totalReviews:  count,
        reviewCount:   count,   // ← champ lu par le frontend
      },
      { where: { id: sellerId } }
    );
  } catch (error) {
    console.error('Erreur mise à jour rating:', error);
  }
}