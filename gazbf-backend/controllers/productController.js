// ==========================================
// FICHIER: controllers/productController.js
// ==========================================
const db = require('../models');
const { Op } = require('sequelize');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Créer un produit (revendeur)
// @route   POST /api/products
// @access  Private (revendeur)
exports.createProduct = async (req, res) => {
  try {
    const { bottleType, brand, price, quantity, productImage } = req.body;

    // Vérifier les champs requis
    if (!bottleType || !brand || !price || quantity === undefined) {
      return ResponseHandler.error(res, 'Tous les champs sont requis', 400);
    }

    // Vérifier si le produit existe déjà pour ce revendeur
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

    // Créer le produit
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

// @desc    Obtenir tous les produits d'un revendeur
// @route   GET /api/products/seller/:sellerId
// @access  Public
exports.getSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const products = await db.Product.findAll({
      where: { 
        sellerId,
        isActive: true
      },
      include: [
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'businessName', 'phone', 'quarter', 'city', 'averageRating']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ResponseHandler.success(
      res,
      'Produits récupérés',
      products
    );
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir mes produits (revendeur connecté)
// @route   GET /api/products/my-products
// @access  Private (revendeur)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: { sellerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    // Statistiques
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

    // Vérifier que le produit appartient au revendeur
    if (product.sellerId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    // Mettre à jour
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

// @desc    Rechercher des produits avec filtres
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
      radius = 10 // rayon par défaut en km
    } = req.query;

    // Construction des filtres
    const where = { isActive: true };

    if (bottleType) where.bottleType = bottleType;
    if (brand) where.brand = brand;
    if (status) where.status = status;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    // Filtre sur le revendeur
    const sellerWhere = { 
      isActive: true,
      validationStatus: 'approved'
    };
    
    if (city) sellerWhere.city = city;

    const products = await db.Product.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'seller',
          where: sellerWhere,
          attributes: [
            'id', 'businessName', 'phone', 'quarter', 'city',
            'latitude', 'longitude', 'averageRating', 'totalReviews',
            'deliveryAvailable', 'deliveryFee'
          ]
        }
      ]
    });

    // Filtrer par distance si coordonnées fournies
    let filteredProducts = products;
    if (latitude && longitude) {
      filteredProducts = products.filter(product => {
        const sellerLat = parseFloat(product.seller.latitude);
        const sellerLng = parseFloat(product.seller.longitude);
        
        if (!sellerLat || !sellerLng) return false;
        
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          sellerLat,
          sellerLng
        );
        
        product.dataValues.distance = distance;
        return distance <= radius;
      });

      // Trier par distance
      filteredProducts.sort((a, b) => a.dataValues.distance - b.dataValues.distance);
    }

    return ResponseHandler.success(
      res,
      'Résultats de recherche',
      {
        count: filteredProducts.length,
        products: filteredProducts
      }
    );
  } catch (error) {
    console.error('Erreur recherche produits:', error);
    return ResponseHandler.error(res, 'Erreur lors de la recherche', 500);
  }
};

// @desc    Incrémenter le compteur de vues d'un produit
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

// Fonction helper pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = exports;