// ==========================================
// FICHIER: controllers/productController.js (VERSION CORRIGÉE)
// ✅ Les clients VOIENT les revendeurs sans accès
// ✅ Les détails sensibles sont masqués (téléphone, GPS)
// ==========================================
const db = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');

/**
 * ✅ Helper pour obtenir le filtre de visibilité des revendeurs
 */
async function getSellerVisibilityFilter() {
  try {
    const pricingConfig = await db.Pricing.findOne({
      where: { targetRole: 'revendeur' }
    });

    if (!pricingConfig || !pricingConfig.isActive) {
      console.log('🆓 Système DÉSACTIVÉ - TOUS les revendeurs approuvés sont visibles (gratuit)');
      return null;
    }

    const now = new Date();
    const visibilityFilter = {
      [Op.or]: [
        {
          freeTrialEndDate: {
            [Op.gt]: now
          }
        },
        {
          subscriptionEndDate: {
            [Op.gt]: now
          },
          hasActiveSubscription: true
        },
        {
          gracePeriodEndDate: {
            [Op.gt]: now
          }
        }
      ]
    };

    console.log('🔒 Système ACTIF - Seuls les revendeurs avec abonnement sont visibles');
    return visibilityFilter;
  } catch (error) {
    console.error('❌ Erreur filtre de visibilité:', error);
    return null;
  }
}

/**
 * ✅ Helper pour masquer les infos sensibles si pas d'accès client
 */
function maskSensitiveInfo(seller, hasClientAccess) {
  if (hasClientAccess) {
    return seller; // Tout est visible
  }

  // Masquer téléphone et GPS
  return {
    ...seller,
    phone: null, // ✅ Masqué
    latitude: null, // ✅ Masqué
    longitude: null, // ✅ Masqué
    // Le reste est visible
    id: seller.id,
    businessName: seller.businessName,
    firstName: seller.firstName,
    lastName: seller.lastName,
    quarter: seller.quarter,
    city: seller.city,
    averageRating: seller.averageRating,
    totalReviews: seller.totalReviews,
    deliveryAvailable: seller.deliveryAvailable,
    deliveryFee: seller.deliveryFee,
    openingHours: seller.openingHours
  };
}

// @desc    Rechercher des produits avec filtres + FILTRAGE REVENDEURS VISIBLES
// @route   GET /api/products/search
// @access  Public
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
      radius = 10,
      userId
    } = req.query;

    console.log('🔍 Recherche avec position:', { 
      latitude, 
      longitude, 
      radius,
      city,
      bottleType,
      userId 
    });

    // ✅ VÉRIFIER L'ACCÈS CLIENT (MAIS NE PAS BLOQUER LA RECHERCHE)
    let hasClientAccess = false;
    const clientPricingConfig = await db.Pricing.findOne({
      where: { targetRole: 'client' }
    });

    if (clientPricingConfig?.isActive) {
      // Système de tarification client ACTIF
      console.log('🔒 Système de tarification CLIENT activé');

      if (userId) {
        // Vérifier l'accès de l'utilisateur connecté
        const client = await db.User.findByPk(userId);
        
        if (client) {
          const now = new Date();
          hasClientAccess = client.accessExpiryDate && new Date(client.accessExpiryDate) > now;
          
          if (hasClientAccess) {
            console.log('✅ Client avec accès actif vérifié');
          } else {
            console.log('⚠️ Client sans accès - Infos sensibles masquées');
          }
        }
      } else {
        console.log('⚠️ Utilisateur non connecté - Infos sensibles masquées');
      }
    } else {
      // Système désactivé = accès complet gratuit
      hasClientAccess = true;
      console.log('🆓 Système de tarification CLIENT désactivé - Accès gratuit');
    }

    // Construction des filtres produits
    const where = { isActive: true };

    if (bottleType) where.bottleType = bottleType;
    if (brand) where.brand = brand;
    if (status) where.status = status;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    // Filtre de base sur le revendeur
    const sellerWhere = { 
      isActive: true,
      validationStatus: 'approved'
    };
    
    if (city) sellerWhere.city = city;

    // Ajouter le filtre de visibilité (abonnement revendeur)
    const visibilityFilter = await getSellerVisibilityFilter();
    
    if (visibilityFilter !== null) {
      Object.assign(sellerWhere, visibilityFilter);
      console.log('🔒 Filtre d\'abonnement REVENDEUR appliqué');
    } else {
      console.log('🆓 Système REVENDEUR DÉSACTIVÉ - TOUS les revendeurs approuvés sont visibles gratuitement');
    }

    // Récupérer les produits avec leurs revendeurs
    const products = await db.Product.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'seller',
          where: sellerWhere,
          required: true,
          attributes: [
            'id', 'businessName', 'firstName', 'lastName', 'phone', 
            'quarter', 'city', 'latitude', 'longitude', 
            'averageRating', 'totalReviews',
            'deliveryAvailable', 'deliveryFee', 'openingHours'
          ]
        }
      ]
    });

    console.log(`📦 ${products.length} produits trouvés avec revendeurs valides`);

    // Regrouper par revendeur
    const sellersMap = new Map();
    
    products.forEach(product => {
      const sellerId = product.seller.id;
      
      if (!sellersMap.has(sellerId)) {
        // ✅ Masquer les infos sensibles si pas d'accès
        const rawSellerData = {
          id: product.seller.id,
          businessName: product.seller.businessName,
          firstName: product.seller.firstName,
          lastName: product.seller.lastName,
          phone: product.seller.phone,
          quarter: product.seller.quarter,
          city: product.seller.city,
          latitude: product.seller.latitude,
          longitude: product.seller.longitude,
          averageRating: product.seller.averageRating,
          totalReviews: product.seller.totalReviews,
          deliveryAvailable: product.seller.deliveryAvailable,
          deliveryFee: product.seller.deliveryFee,
          openingHours: product.seller.openingHours,
          products: [],
          distance: null
        };

        // ✅ Appliquer le masquage si nécessaire
        const sellerData = maskSensitiveInfo(rawSellerData, hasClientAccess);
        
        // Calculer la distance si coordonnées fournies ET accès actif
        if (hasClientAccess && latitude && longitude && rawSellerData.latitude && rawSellerData.longitude) {
          const distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(rawSellerData.latitude),
            parseFloat(rawSellerData.longitude)
          );
          sellerData.distance = distance;
          console.log(`📍 ${sellerData.businessName || 'Revendeur'}: ${distance} km`);
        } else if (!hasClientAccess) {
          // Pas d'accès = pas de distance
          sellerData.distance = null;
        }
        
        sellersMap.set(sellerId, sellerData);
      }
      
      const productData = {
        id: product.id,
        bottleType: product.bottleType,
        brand: product.brand,
        price: parseFloat(product.price),
        quantity: product.quantity,
        status: product.status,
        productImage: product.productImage,
        viewCount: product.viewCount,
        orderCount: product.orderCount,
        createdAt: product.createdAt
      };
      
      sellersMap.get(sellerId).products.push(productData);
    });

    let sellers = Array.from(sellersMap.values());
    console.log(`👥 ${sellers.length} revendeurs uniques trouvés`);

    // Filtrer par rayon UNIQUEMENT si accès actif et coordonnées fournies
    if (hasClientAccess && latitude && longitude) {
      const beforeFilter = sellers.length;
      sellers = sellers.filter(seller => {
        if (seller.distance === null) {
          console.log(`⚠️ ${seller.businessName || 'Revendeur'}: pas de GPS`);
          return true;
        }
        return seller.distance <= parseFloat(radius);
      });
      
      console.log(`🎯 ${sellers.length}/${beforeFilter} revendeurs dans rayon ${radius}km`);

      // Trier par distance
      sellers.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    // ✅ RETOURNER LES DONNÉES AVEC INDICATEUR D'ACCÈS
    return ResponseHandler.success(
      res,
      'Résultats de recherche',
      {
        count: sellers.length,
        sellers: sellers,
        userLocation: hasClientAccess && latitude && longitude ? { 
          latitude: parseFloat(latitude), 
          longitude: parseFloat(longitude) 
        } : null,
        radius: parseFloat(radius),
        // ✅ INFORMATIONS D'ACCÈS
        accessInfo: {
          hasAccess: hasClientAccess,
          isSystemActive: clientPricingConfig?.isActive || false,
          price: clientPricingConfig?.accessPrice24h || 0,
          duration: clientPricingConfig?.accessDurationHours || 24,
          message: hasClientAccess 
            ? 'Accès complet activé'
            : 'Informations limitées - Achetez un accès pour voir les détails'
        }
      }
    );
  } catch (error) {
    console.error('❌ Erreur recherche produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la recherche', 500);
  }
};

// @desc    Obtenir tous les produits d'un revendeur
// @route   GET /api/products/seller/:sellerId
// @access  Public
exports.getSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { latitude, longitude, userId } = req.query;

    const seller = await db.User.findOne({
      where: {
        id: sellerId,
        isActive: true,
        validationStatus: 'approved'
      }
    });
    
    if (!seller) {
      return ResponseHandler.error(res, 'Revendeur non trouvé', 404);
    }

    // Vérifier abonnement revendeur
    const visibilityFilter = await getSellerVisibilityFilter();
    
    if (visibilityFilter !== null) {
      const now = new Date();
      const hasAccess = 
        (seller.freeTrialEndDate && new Date(seller.freeTrialEndDate) > now) ||
        (seller.subscriptionEndDate && new Date(seller.subscriptionEndDate) > now && seller.hasActiveSubscription) ||
        (seller.gracePeriodEndDate && new Date(seller.gracePeriodEndDate) > now);

      if (!hasAccess) {
        console.log('🔒 Revendeur sans abonnement actif - Système ACTIF');
        return ResponseHandler.error(
          res, 
          'Ce revendeur n\'est pas disponible actuellement', 
          403
        );
      }
      console.log('✅ Revendeur avec abonnement actif vérifié');
    } else {
      console.log('🆓 Système DÉSACTIVÉ - Pas de vérification d\'abonnement');
    }

    // ✅ Vérifier accès client
    let hasClientAccess = false;
    const clientPricingConfig = await db.Pricing.findOne({
      where: { targetRole: 'client' }
    });

    if (clientPricingConfig?.isActive && userId) {
      const client = await db.User.findByPk(userId);
      if (client) {
        const now = new Date();
        hasClientAccess = client.accessExpiryDate && new Date(client.accessExpiryDate) > now;
      }
    } else if (!clientPricingConfig?.isActive) {
      hasClientAccess = true;
    }

    const products = await db.Product.findAll({
      where: { 
        sellerId,
        isActive: true
      },
      include: [
        {
          model: db.User,
          as: 'seller',
          attributes: [
            'id', 'businessName', 'firstName', 'lastName', 'phone', 
            'quarter', 'city', 'averageRating', 'totalReviews',
            'latitude', 'longitude', 'deliveryAvailable', 'deliveryFee'
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // ✅ Masquer infos sensibles si pas d'accès
    if (products.length > 0 && products[0].seller) {
      const rawSeller = products[0].seller;
      const maskedSeller = maskSensitiveInfo(rawSeller.dataValues, hasClientAccess);
      
      if (hasClientAccess && latitude && longitude && rawSeller.latitude && rawSeller.longitude) {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(rawSeller.latitude),
          parseFloat(rawSeller.longitude)
        );
        maskedSeller.distance = distance;
        console.log(`📍 Distance calculée: ${distance} km`);
      }

      // Remplacer le seller par la version masquée
      products.forEach(p => {
        p.seller.dataValues = maskedSeller;
      });
    }

    return ResponseHandler.success(
      res,
      'Produits récupérés',
      {
        products,
        accessInfo: {
          hasAccess: hasClientAccess,
          message: hasClientAccess 
            ? 'Accès complet' 
            : 'Infos limitées - Achetez un accès pour voir les détails'
        }
      }
    );
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// Fonction helper pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// @desc    Créer un produit
// @route   POST /api/products
// @access  Private (revendeur)
exports.createProduct = async (req, res) => {
  try {
    const { bottleType, brand, price, quantity, productImage } = req.body;

    if (!bottleType || !brand || !price || quantity === undefined) {
      return ResponseHandler.error(res, 'Tous les champs sont requis', 400);
    }

    const existingProduct = await db.Product.findOne({
      where: {
        sellerId: req.user.id,
        bottleType,
        brand
      }
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
      bottleType,
      brand,
      price,
      quantity,
      productImage
    });

    return ResponseHandler.success(
      res,
      'Produit ajouté avec succès',
      product,
      201
    );
  } catch (error) {
    console.error('Erreur création produit:', error);
    return ResponseHandler.error(res, 'Erreur lors de la création du produit', 500);
  }
};

// @desc    Obtenir mes produits
// @route   GET /api/products/my-products
// @access  Private (revendeur)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: { sellerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total: products.length,
      available: products.filter(p => p.status === 'available').length,
      limited: products.filter(p => p.status === 'limited').length,
      outOfStock: products.filter(p => p.status === 'out_of_stock').length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
    };

    return ResponseHandler.success(
      res,
      'Vos produits récupérés',
      {
        products,
        stats
      }
    );
  } catch (error) {
    console.error('Erreur récupération mes produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Mettre à jour un produit
// @route   PUT /api/products/:id
// @access  Private (revendeur)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, quantity, productImage, isActive } = req.body;

    const product = await db.Product.findByPk(id);

    if (!product) {
      return ResponseHandler.error(res, 'Produit non trouvé', 404);
    }

    if (product.sellerId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    const updates = {};
    if (price !== undefined) updates.price = price;
    if (quantity !== undefined) updates.quantity = quantity;
    if (productImage !== undefined) updates.productImage = productImage;
    if (isActive !== undefined) updates.isActive = isActive;

    await product.update(updates);

    return ResponseHandler.success(
      res,
      'Produit mis à jour',
      product
    );
  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// @desc    Supprimer un produit
// @route   DELETE /api/products/:id
// @access  Private (revendeur)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id);

    if (!product) {
      return ResponseHandler.error(res, 'Produit non trouvé', 404);
    }

    if (product.sellerId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    await product.destroy();

    return ResponseHandler.success(res, 'Produit supprimé');
  } catch (error) {
    console.error('Erreur suppression produit:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// @desc    Incrémenter le compteur de vues
// @route   POST /api/products/:id/view
// @access  Public
exports.incrementView = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.Product.findByPk(id);
    
    if (!product) {
      return ResponseHandler.error(res, 'Produit non trouvé', 404);
    }

    await product.increment('viewCount');

    return ResponseHandler.success(res, 'Vue enregistrée');
  } catch (error) {
    console.error('Erreur incrémentation vue:', error);
    return ResponseHandler.error(res, 'Erreur', 500);
  }
};

module.exports = exports;