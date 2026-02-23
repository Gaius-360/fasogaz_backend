// ==========================================
// FICHIER: middleware/cacheMiddleware.js
// Middleware pour gérer le cache Redis automatiquement
// ==========================================

const { getCache, setCache, CACHE_DURATION } = require('../config/redis');

/**
 * Middleware de cache générique
 * @param {number} duration - Durée du cache en secondes
 * @param {function} keyGenerator - Fonction pour générer la clé de cache
 */
const cacheMiddleware = (duration = 300, keyGenerator) => {
  return async (req, res, next) => {
    // Générer la clé de cache
    const cacheKey = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl}`;
    
    try {
      // Vérifier si les données sont en cache
      const cachedData = await getCache(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }
      
      console.log(`❌ Cache MISS: ${cacheKey}`);
      
      // Stocker la fonction json originale
      const originalJson = res.json.bind(res);
      
      // Override de la fonction json pour cacher la réponse
      res.json = function(data) {
        // Mettre en cache uniquement les réponses réussies
        if (data.success) {
          setCache(cacheKey, data, duration).catch(err => {
            console.error('Erreur mise en cache:', err);
          });
        }
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      console.error('❌ Erreur middleware cache:', error);
      next(); // Continuer sans cache en cas d'erreur
    }
  };
};

/**
 * Middleware spécifique pour la recherche de produits
 */
const productSearchCache = cacheMiddleware(
  CACHE_DURATION.PRODUCT_SEARCH,
  (req) => {
    const { city, bottleType, brand, minPrice, maxPrice, latitude, longitude, radius } = req.query;
    
    // Arrondir les coordonnées GPS pour grouper les requêtes similaires
    const roundedLat = latitude ? Math.round(parseFloat(latitude) * 100) / 100 : 'none';
    const roundedLon = longitude ? Math.round(parseFloat(longitude) * 100) / 100 : 'none';
    
    return `search:${city || 'all'}:${bottleType || 'all'}:${brand || 'all'}:${minPrice || 0}:${maxPrice || 'max'}:${roundedLat}:${roundedLon}:${radius || 10}`;
  }
);

/**
 * Middleware pour la liste des revendeurs par ville
 */
const sellerListCache = cacheMiddleware(
  CACHE_DURATION.SELLER_LIST,
  (req) => `sellers:${req.query.city || 'all'}`
);

/**
 * Middleware pour les détails d'un revendeur
 */
const sellerDetailCache = cacheMiddleware(
  CACHE_DURATION.SELLER_DETAIL,
  (req) => `seller:${req.params.sellerId}`
);

/**
 * Middleware pour les produits d'un revendeur
 */
const sellerProductsCache = cacheMiddleware(
  CACHE_DURATION.SELLER_PRODUCTS,
  (req) => `seller:products:${req.params.sellerId}`
);

/**
 * Middleware pour les revendeurs à proximité
 */
const nearbySellersCache = cacheMiddleware(
  CACHE_DURATION.NEARBY_SELLERS,
  (req) => {
    const { latitude, longitude, radius } = req.query;
    const roundedLat = Math.round(parseFloat(latitude) * 100) / 100;
    const roundedLon = Math.round(parseFloat(longitude) * 100) / 100;
    return `nearby:${roundedLat}:${roundedLon}:${radius || 10}`;
  }
);

/**
 * Invalidation du cache lors de modifications
 */
const invalidateCache = {
  /**
   * Invalider le cache d'un revendeur spécifique
   */
  seller: async (sellerId) => {
    const { deleteCachePattern } = require('../config/redis');
    await deleteCachePattern(`seller:${sellerId}*`);
    await deleteCachePattern(`sellers:*`);
    await deleteCachePattern(`search:*`);
    await deleteCachePattern(`nearby:*`);
    console.log(`🗑️ Cache invalidé pour revendeur ${sellerId}`);
  },
  
  /**
   * Invalider le cache des produits
   */
  products: async (sellerId) => {
    const { deleteCachePattern } = require('../config/redis');
    await deleteCachePattern(`seller:products:${sellerId}`);
    await deleteCachePattern(`search:*`);
    await deleteCachePattern(`nearby:*`);
    console.log(`🗑️ Cache produits invalidé pour revendeur ${sellerId}`);
  },
  
  /**
   * Invalider tout le cache de recherche
   */
  searchAll: async () => {
    const { deleteCachePattern } = require('../config/redis');
    await deleteCachePattern('search:*');
    await deleteCachePattern('nearby:*');
    console.log('🗑️ Cache de recherche invalidé');
  }
};

module.exports = {
  cacheMiddleware,
  productSearchCache,
  sellerListCache,
  sellerDetailCache,
  sellerProductsCache,
  nearbySellersCache,
  invalidateCache
};