// ==========================================
// FICHIER: controllers/productController.js
// ✅ REFONTE: Nouveau système d'abonnement client
//
// RÈGLES :
//   - hasClientAccess vérifie subscriptionEndDate (plus accessExpiryDate)
//   - Distance calculée pour TOUS les sellers (abonné ou non)
//   - Tri par distance AVANT le slice
//   - Sans abonnement → 3 sellers max (les plus proches, avec distance)
//   - Avec abonnement  → tous les sellers de toutes les villes (avec distance)
//   - Filtre ville : abonnés peuvent filtrer par ville ou voir toutes les villes
//   - Non-abonnés : forcés sur leur propre ville uniquement
//   - phone/latitude/longitude TOUJOURS visibles
// ==========================================

const db = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');

// ── Villes disponibles sur la plateforme ───────────────────────────────────
const AVAILABLE_CITIES = ['Ouagadougou', 'Bobo-Dioulasso'];

// ── Helper : filtre abonnement revendeur ────────────────────────────────────
async function getSellerVisibilityFilter() {
  try {
    const pricingConfig = await db.Pricing.findOne({ where: { targetRole: 'revendeur' } });

    if (!pricingConfig || !pricingConfig.isActive) {
      console.log('🆓 Système revendeur DÉSACTIVÉ — tous les revendeurs approuvés visibles');
      return null;
    }

    const now = new Date();
    console.log('🔒 Système revendeur ACTIF — filtre abonnement appliqué');
    return {
      [Op.or]: [
        { freeTrialEndDate:    { [Op.gt]: now } },
        { subscriptionEndDate: { [Op.gt]: now }, hasActiveSubscription: true },
        { gracePeriodEndDate:  { [Op.gt]: now } }
      ]
    };
  } catch (error) {
    console.error('❌ Erreur filtre visibilité revendeur:', error);
    return null;
  }
}

// ── Helper : vérifier abonnement CLIENT ────────────────────────────────────
// ✅ Utilise subscriptionEndDate (nouveau système), plus accessExpiryDate
// ✅ Limite à 3 sans abonnement (au lieu de 5)
async function checkClientSubscription(userId, pricingConfig) {
  // Système désactivé → accès illimité
  if (!pricingConfig || !pricingConfig.isActive) {
    return { hasAccess: true, maxSellers: null, accessType: 'free' };
  }

  if (!userId) {
    return { hasAccess: false, maxSellers: 3, accessType: 'none' };
  }

  try {
    const client = await db.User.findByPk(userId);
    if (!client) {
      return { hasAccess: false, maxSellers: 3, accessType: 'none' };
    }

    const now = new Date();

    // Abonnement actif
    if (client.subscriptionEndDate && new Date(client.subscriptionEndDate) > now) {
      console.log(`✅ Client ${userId} — abonnement actif jusqu'au ${client.subscriptionEndDate}`);
      return { hasAccess: true, maxSellers: null, accessType: 'active' };
    }

    // Période d'essai
    if (client.freeTrialEndDate && new Date(client.freeTrialEndDate) > now) {
      console.log(`✅ Client ${userId} — période d'essai active`);
      return { hasAccess: true, maxSellers: null, accessType: 'trial' };
    }

    // Aucun abonnement → limite à 3 revendeurs
    console.log(`⚠️ Client ${userId} — sans abonnement, limite à 3 revendeurs`);
    return { hasAccess: false, maxSellers: 3, accessType: 'none' };

  } catch (error) {
    console.error('❌ Erreur vérification abonnement client:', error);
    return { hasAccess: false, maxSellers: 3, accessType: 'error' };
  }
}

// ── Helper : calcul distance haversine (km) ────────────────────────────────
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ══════════════════════════════════════════════════════════════════════════════
// @desc    Rechercher des produits
// @route   GET /api/products/search
// @access  Public (avec accès optionnel selon abonnement)
// ══════════════════════════════════════════════════════════════════════════════
exports.searchProducts = async (req, res) => {
  try {
    const {
      city,
      bottleType,
      brand,
      minPrice,
      maxPrice,
      status,
      latitude,
      longitude,
      radius
    } = req.query;

    // ✅ Priorité à req.user (token JWT) sur req.query.userId (fallback legacy)
    const userId = req.user?.id || req.query.userId || null;

    console.log('🔍 Recherche:', { city, bottleType, latitude, longitude, radius, userId });

    // ── 1. Vérifier abonnement CLIENT ──────────────────────────────────────
    const clientPricingConfig = await db.Pricing.findOne({ where: { targetRole: 'client' } });
    const clientAccess = await checkClientSubscription(userId, clientPricingConfig);

    console.log(`👤 Accès client: ${clientAccess.accessType}, maxSellers: ${clientAccess.maxSellers ?? 'illimité'}`);

    // ── 2. Filtres produits ────────────────────────────────────────────────
    const productWhere = { isActive: true };
    if (bottleType) productWhere.bottleType = bottleType;
    if (brand)      productWhere.brand      = brand;
    if (status)     productWhere.status     = status;
    if (minPrice || maxPrice) {
      productWhere.price = {};
      if (minPrice) productWhere.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) productWhere.price[Op.lte] = parseFloat(maxPrice);
    }

    // ── 3. Filtres revendeurs ──────────────────────────────────────────────
    const sellerWhere = { isActive: true, validationStatus: 'approved' };

    // ✅ Filtre ville selon abonnement
    // - Non-abonné : forcé sur sa ville uniquement
    // - Abonné sans filtre ville : toutes les villes disponibles
    // - Abonné avec filtre ville valide : ville demandée uniquement
    if (clientAccess.hasAccess) {
      // Abonné : filtre par ville si fourni et valide, sinon toutes les villes
      if (city && AVAILABLE_CITIES.includes(city)) {
        sellerWhere.city = city;
        console.log(`🏙️ Abonné — filtre ville: ${city}`);
      } else {
        sellerWhere.city = { [Op.in]: AVAILABLE_CITIES };
        console.log(`🏙️ Abonné — toutes les villes: ${AVAILABLE_CITIES.join(', ')}`);
      }
    } else {
      // Non-abonné : uniquement sa ville (obligatoire)
      const forcedCity = city || req.user?.city;
      if (forcedCity) {
        sellerWhere.city = forcedCity;
        console.log(`🏙️ Non-abonné — ville forcée: ${forcedCity}`);
      } else {
        // Sécurité : si pas de ville connue, on limite quand même aux villes dispo
        sellerWhere.city = { [Op.in]: AVAILABLE_CITIES };
        console.log(`🏙️ Non-abonné — ville inconnue, fallback toutes villes`);
      }
    }

    const visibilityFilter = await getSellerVisibilityFilter();
    if (visibilityFilter !== null) {
      Object.assign(sellerWhere, visibilityFilter);
    }

    // ── 4. Requête BDD ─────────────────────────────────────────────────────
    const products = await db.Product.findAll({
      where: productWhere,
      include: [{
        model:      db.User,
        as:         'seller',
        where:      sellerWhere,
        required:   true,
        attributes: [
          'id', 'businessName', 'firstName', 'lastName',
          'phone',                          // ✅ toujours retourné
          'quarter', 'city',
          'latitude', 'longitude',          // ✅ toujours retourné
          'averageRating', 'totalReviews',
          'deliveryAvailable', 'deliveryFee', 'openingHours'
        ]
      }]
    });

    console.log(`📦 ${products.length} produits trouvés`);

    // ── 5. Regrouper par revendeur ─────────────────────────────────────────
    const sellersMap = new Map();

    products.forEach(product => {
      const sellerId = product.seller.id;

      if (!sellersMap.has(sellerId)) {
        sellersMap.set(sellerId, {
          id:               product.seller.id,
          businessName:     product.seller.businessName,
          firstName:        product.seller.firstName,
          lastName:         product.seller.lastName,
          phone:            product.seller.phone,       // ✅ visible
          quarter:          product.seller.quarter,
          city:             product.seller.city,
          latitude:         product.seller.latitude,    // ✅ visible
          longitude:        product.seller.longitude,   // ✅ visible
          averageRating:    product.seller.averageRating,
          totalReviews:     product.seller.totalReviews,
          deliveryAvailable: product.seller.deliveryAvailable,
          deliveryFee:      product.seller.deliveryFee,
          openingHours:     product.seller.openingHours,
          products:         [],
          distance:         null
        });
      }

      sellersMap.get(sellerId).products.push({
        id:           product.id,
        bottleType:   product.bottleType,
        brand:        product.brand,
        price:        parseFloat(product.price),
        quantity:     product.quantity,
        status:       product.status,
        productImage: product.productImage,
        viewCount:    product.viewCount,
        orderCount:   product.orderCount,
        createdAt:    product.createdAt
      });
    });

    let sellers = Array.from(sellersMap.values());
    console.log(`👥 ${sellers.length} revendeurs uniques`);

    // ── 6. Calcul distance pour TOUS les sellers ───────────────────────────
    // ✅ Distance calculée INDÉPENDAMMENT de l'abonnement
    //    Sans ça, les 3 sellers affichés sans abonnement n'auraient pas de distance
    const userLat = latitude  ? parseFloat(latitude)  : null;
    const userLon = longitude ? parseFloat(longitude) : null;

    if (userLat && userLon) {
      sellers = sellers.map(seller => {
        if (seller.latitude && seller.longitude) {
          const distance = calculateDistance(
            userLat, userLon,
            parseFloat(seller.latitude),
            parseFloat(seller.longitude)
          );
          return { ...seller, distance };
        }
        return seller; // distance reste null si seller sans GPS
      });

      // Trier par distance croissante (sellers sans GPS à la fin)
      sellers.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      // Filtrer par rayon si fourni (seulement si abonné)
      if (radius && parseFloat(radius) > 0 && clientAccess.hasAccess) {
        const maxRadius   = parseFloat(radius);
        const beforeCount = sellers.length;
        sellers = sellers.filter(s => s.distance === null || s.distance <= maxRadius);
        console.log(`🎯 Filtre rayon ${maxRadius}km: ${sellers.length}/${beforeCount} revendeurs`);
      }
    }

    // ── 7. Appliquer la limite selon l'abonnement ──────────────────────────
    // ✅ Le tri par distance est déjà fait → slice garde les plus proches
    const totalCount  = sellers.length;
    const maxSellers  = clientAccess.maxSellers; // null = illimité
    const limited     = (maxSellers && maxSellers > 0)
      ? sellers.slice(0, maxSellers)
      : sellers;
    const hiddenCount = maxSellers ? Math.max(0, totalCount - limited.length) : 0;

    console.log(`✅ Retour: ${limited.length} sellers (${hiddenCount} masqués)`);

    return ResponseHandler.success(res, 'Résultats de recherche', {
      count:        limited.length,
      sellers:      limited,
      userLocation: (userLat && userLon) ? { latitude: userLat, longitude: userLon } : null,
      radius:       radius ? parseFloat(radius) : null,
      // ✅ Infos accès pour le frontend
      accessInfo: {
        hasAccess:      clientAccess.hasAccess,
        accessType:     clientAccess.accessType,
        maxSellers,
        hiddenCount,
        isSystemActive: clientPricingConfig?.isActive || false
      }
    });

  } catch (error) {
    console.error('❌ Erreur recherche produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la recherche', 500);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// @desc    Obtenir tous les produits d'un revendeur
// @route   GET /api/products/seller/:sellerId
// @access  Public
// ══════════════════════════════════════════════════════════════════════════════
exports.getSellerProducts = async (req, res) => {
  try {
    const { sellerId }            = req.params;
    const { latitude, longitude } = req.query;
    // ✅ Priorité req.user sur req.query.userId
    const userId = req.user?.id || req.query.userId || null;

    const seller = await db.User.findOne({
      where: { id: sellerId, isActive: true, validationStatus: 'approved' }
    });

    if (!seller) {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    // Vérifier abonnement revendeur
    const visibilityFilter = await getSellerVisibilityFilter();
    if (visibilityFilter !== null) {
      const now       = new Date();
      const hasAccess =
        (seller.freeTrialEndDate    && new Date(seller.freeTrialEndDate)    > now) ||
        (seller.subscriptionEndDate && new Date(seller.subscriptionEndDate) > now && seller.hasActiveSubscription) ||
        (seller.gracePeriodEndDate  && new Date(seller.gracePeriodEndDate)  > now);

      if (!hasAccess) {
        return ResponseHandler.error(res, 'Ce revendeur n\'est pas disponible actuellement', 403);
      }
    }

    // Vérifier abonnement client
    const clientPricingConfig = await db.Pricing.findOne({ where: { targetRole: 'client' } });
    const clientAccess        = await checkClientSubscription(userId, clientPricingConfig);

    const products = await db.Product.findAll({
      where:   { sellerId, isActive: true },
      include: [{
        model:      db.User,
        as:         'seller',
        attributes: [
          'id', 'businessName', 'firstName', 'lastName',
          'phone', 'quarter', 'city', 'averageRating', 'totalReviews',
          'latitude', 'longitude', 'deliveryAvailable', 'deliveryFee'
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Calculer distance si coordonnées fournies
    let distance = null;
    if (latitude && longitude && seller.latitude && seller.longitude) {
      distance = calculateDistance(
        parseFloat(latitude), parseFloat(longitude),
        parseFloat(seller.latitude), parseFloat(seller.longitude)
      );
    }

    return ResponseHandler.success(res, 'Produits récupérés', {
      products,
      distance,
      accessInfo: {
        hasAccess:  clientAccess.hasAccess,
        accessType: clientAccess.accessType
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération produits revendeur:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// @desc    Créer un produit
// @route   POST /api/products
// @access  Private (revendeur)
// ══════════════════════════════════════════════════════════════════════════════
exports.createProduct = async (req, res) => {
  try {
    const { bottleType, brand, price, quantity, productImage } = req.body;

    if (!bottleType || !brand || !price || quantity === undefined) {
      return ResponseHandler.error(res, 'Tous les champs sont requis', 400);
    }

    const existingProduct = await db.Product.findOne({
      where: { sellerId: req.user.id, bottleType, brand }
    });

    if (existingProduct) {
      return ResponseHandler.error(
        res,
        'Ce produit existe déjà dans votre catalogue. Utilisez la mise à jour.',
        409
      );
    }

    const product = await db.Product.create({
      sellerId: req.user.id,
      bottleType, brand, price, quantity, productImage
    });

    return ResponseHandler.success(res, 'Produit ajouté avec succès', product, 201);

  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    return ResponseHandler.error(res, 'Erreur lors de la création du produit', 500);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// @desc    Obtenir mes produits
// @route   GET /api/products/my-products
// @access  Private (revendeur)
// ══════════════════════════════════════════════════════════════════════════════
exports.getMyProducts = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: { sellerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total:      products.length,
      available:  products.filter(p => p.status === 'available').length,
      limited:    products.filter(p => p.status === 'limited').length,
      outOfStock: products.filter(p => p.status === 'out_of_stock').length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
    };

    return ResponseHandler.success(res, 'Vos produits récupérés', { products, stats });

  } catch (error) {
    console.error('❌ Erreur récupération mes produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// @desc    Mettre à jour un produit
// @route   PUT /api/products/:id
// @access  Private (revendeur)
// ══════════════════════════════════════════════════════════════════════════════
exports.updateProduct = async (req, res) => {
  try {
    const { id }                                      = req.params;
    const { price, quantity, productImage, isActive } = req.body;

    const product = await db.Product.findByPk(id);
    if (!product)                        return ResponseHandler.error(res, 'Produit non trouvé', 404);
    if (product.sellerId !== req.user.id) return ResponseHandler.error(res, 'Non autorisé', 403);

    const updates = {};
    if (price        !== undefined) updates.price        = price;
    if (quantity     !== undefined) updates.quantity     = quantity;
    if (productImage !== undefined) updates.productImage = productImage;
    if (isActive     !== undefined) updates.isActive     = isActive;

    await product.update(updates);
    return ResponseHandler.success(res, 'Produit mis à jour', product);

  } catch (error) {
    console.error('❌ Erreur mise à jour produit:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// @desc    Supprimer un produit
// @route   DELETE /api/products/:id
// @access  Private (revendeur)
// ══════════════════════════════════════════════════════════════════════════════
exports.deleteProduct = async (req, res) => {
  try {
    const { id }  = req.params;
    const product = await db.Product.findByPk(id);

    if (!product)                        return ResponseHandler.error(res, 'Produit non trouvé', 404);
    if (product.sellerId !== req.user.id) return ResponseHandler.error(res, 'Non autorisé', 403);

    await product.destroy();
    return ResponseHandler.success(res, 'Produit supprimé');

  } catch (error) {
    console.error('❌ Erreur suppression produit:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// @desc    Incrémenter le compteur de vues
// @route   POST /api/products/:id/view
// @access  Public
// ══════════════════════════════════════════════════════════════════════════════
exports.incrementView = async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);
    if (!product) return ResponseHandler.error(res, 'Produit non trouvé', 404);
    await product.increment('viewCount');
    return ResponseHandler.success(res, 'Vue enregistrée');
  } catch (error) {
    console.error('❌ Erreur incrémentation vue:', error);
    return ResponseHandler.error(res, 'Erreur', 500);
  }
};

module.exports = exports;