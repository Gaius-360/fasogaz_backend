// ==========================================
// FICHIER: controllers/reviewController.js
// ✅ v3 — fixes PostgreSQL :
//    - getMyReviews : include Product conditionnel (required:false + try/catch)
//    - getSellerReviews : idem
//    - getReceivedReviews : idem
//    - Tous les catch exposent error.message en dev
//    - raw:true sur les requêtes stats
// ==========================================

const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const { validateUserText } = require('../utils/contentFilter');

// ── Helper : vérifie si l'association Product existe dans les modèles ──────
// Si la migration n'a pas encore tourné ou si le modèle Product n'est pas
// associé à Review, Sequelize plante au moment du findAll avec l'include.
const hasProductAssociation = () => {
  try {
    return !!(db.Review.associations && db.Review.associations.product);
  } catch (_) {
    return false;
  }
};

// ── Helper : construit l'include Product de façon défensive ───────────────
// Champs réels du modèle Product : bottleType, brand, price, quantity, status
// Pas de colonne 'name' — on affiche brand + bottleType côté frontend.
const productInclude = () =>
  hasProductAssociation()
    ? [{
        model:      db.Product,
        as:         'product',
        attributes: ['id', 'brand', 'bottleType'],
        required:   false     // LEFT JOIN — ne filtre pas les avis sans produit
      }]
    : [];

// @desc    Créer un avis
// @route   POST /api/reviews
// @access  Private (client)
exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, productId, reviewType = 'service' } = req.body;

    if (!orderId || !rating) {
      return ResponseHandler.error(res, 'Commande et note requis', 400);
    }

    if (rating < 1 || rating > 5) {
      return ResponseHandler.error(res, 'La note doit être entre 1 et 5', 400);
    }

    if (!['service', 'product'].includes(reviewType)) {
      return ResponseHandler.error(res, "Type d'avis invalide (service ou product)", 400);
    }

    if (reviewType === 'product' && !productId) {
      return ResponseHandler.error(res, 'productId requis pour un avis produit', 400);
    }

    if (comment) {
      const check = validateUserText(comment, 'Le commentaire');
      if (!check.valid) {
        return ResponseHandler.error(res, check.message, 422);
      }
    }

    const order = await db.Order.findOne({
      where: { id: orderId, customerId: req.user.id }
    });

    if (!order) {
      return ResponseHandler.error(res, 'Commande non trouvée', 404);
    }

    if (order.status !== 'completed') {
      return ResponseHandler.error(
        res,
        'Vous ne pouvez noter que les commandes complétées',
        400
      );
    }

    // Vérification doublon sur (orderId, reviewType) — aligné sur l'index unique
    const existingReview = await db.Review.findOne({
      where: { orderId, reviewType }
    });
    if (existingReview) {
      return ResponseHandler.error(
        res,
        `Vous avez déjà soumis un avis "${reviewType}" pour cette commande`,
        409
      );
    }

    const review = await db.Review.create({
      orderId,
      customerId: req.user.id,
      sellerId:   order.sellerId,
      productId:  productId || null,
      reviewType,
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
    console.error('Erreur création avis:', error.message);
    return ResponseHandler.error(
      res,
      process.env.NODE_ENV === 'development'
        ? `Erreur lors de la création: ${error.message}`
        : 'Erreur lors de la création',
      500
    );
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
          model:      db.Order,
          as:         'order',
          attributes: ['id', 'orderNumber', 'total', 'createdAt']
        },
        {
          model:      db.User,
          as:         'seller',
          attributes: ['id', 'businessName', 'phone']
        },
        // ✅ Défensif : inclut Product seulement si l'association existe
        ...productInclude()
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(res, 'Avis récupérés', reviews);
  } catch (error) {
    console.error('Erreur récupération avis (getMyReviews):', error.message);
    console.error(error.stack);
    return ResponseHandler.error(
      res,
      process.env.NODE_ENV === 'development'
        ? `Erreur lors de la récupération: ${error.message}`
        : 'Erreur lors de la récupération',
      500
    );
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
          model:      db.User,
          as:         'customer',
          // Pas d'id ni d'email sur la route publique — anonymisation frontend
          attributes: ['firstName', 'lastName']
        },
        {
          model:      db.Order,
          as:         'order',
          attributes: ['id', 'orderNumber', 'createdAt']
        },
        ...productInclude()
      ],
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset
    });

    // Stats globales en une seule requête légère
    const allRatings = await db.Review.findAll({
      where:      { sellerId },
      attributes: ['rating'],
      raw:        true
    });

    const total   = allRatings.length;
    const average = total > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allRatings.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return ResponseHandler.success(res, 'Avis récupérés', {
      reviews,
      stats: { total, average: parseFloat(average.toFixed(2)), distribution },
      pagination: {
        currentPage:  parseInt(page),
        totalPages:   Math.ceil(count / parseInt(limit)),
        totalItems:   count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération avis revendeur:', error.message);
    console.error(error.stack);
    return ResponseHandler.error(
      res,
      process.env.NODE_ENV === 'development'
        ? `Erreur lors de la récupération: ${error.message}`
        : 'Erreur lors de la récupération',
      500
    );
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
          model:      db.User,
          as:         'customer',
          // Usage interne revendeur : id + prénom + nom + téléphone (identification litige)
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model:      db.Order,
          as:         'order',
          attributes: ['id', 'orderNumber', 'total', 'createdAt']
        },
        ...productInclude()
      ],
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total:           reviews.length,
      average:         reviews.length > 0
        ? parseFloat(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
          )
        : 0,
      withResponse:    reviews.filter(r =>  r.sellerResponse).length,
      withoutResponse: reviews.filter(r => !r.sellerResponse).length
    };

    return ResponseHandler.success(res, 'Avis reçus récupérés', { reviews, stats });
  } catch (error) {
    console.error('Erreur récupération avis reçus:', error.message);
    console.error(error.stack);
    return ResponseHandler.error(
      res,
      process.env.NODE_ENV === 'development'
        ? `Erreur lors de la récupération: ${error.message}`
        : 'Erreur lors de la récupération',
      500
    );
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

    // ✅ fields: [...] — évite que Sequelize valide/écrive toutes les colonnes
    //    (dont reviewType ENUM absent en base si migration pas encore jouée)
    await review.update(
      {
        sellerResponse: response.trim(),
        respondedAt:    new Date()
      },
      {
        fields: ['sellerResponse', 'respondedAt']
      }
    );

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
    console.error('Erreur réponse avis:', error.message);
    console.error(error.stack);
    return ResponseHandler.error(
      res,
      process.env.NODE_ENV === 'development'
        ? `Erreur lors de la réponse: ${error.message}`
        : 'Erreur lors de la réponse',
      500
    );
  }
};

// ── Helper interne ─────────────────────────────────────────────────────────

async function updateSellerRating(sellerId) {
  try {
    const reviews = await db.Review.findAll({
      where:      { sellerId },
      attributes: ['rating'],
      raw:        true
    });

    const count   = reviews.length;
    const average = count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    await db.User.update(
      {
        averageRating: parseFloat(average.toFixed(2)),
        totalReviews:  count,
        reviewCount:   count,
      },
      { where: { id: sellerId } }
    );
  } catch (error) {
    console.error('Erreur mise à jour rating:', error.message);
  }
}