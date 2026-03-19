// ==========================================
// FICHIER: routes/geocodingRoutes.js
// ✅ FIX 429 : utilise geocodingLimiter centralisé (middleware/rateLimiter.js)
//             au lieu du bloc rateLimit inline fragile
// ✅ Cache mémoire LRU 24h — les quartiers ne bougent pas
// ✅ File d'attente Nominatim — 1 seule requête simultanée + délai 1,1s
// ✅ Arrêt anticipé multi-zoom — dès qu'un quartier est trouvé
// ==========================================

const express              = require('express');
const router               = express.Router();
const axios                = require('axios');
const { geocodingLimiter } = require('../middleware/rateLimiter');

// ── Rate limiter dédié (30 req/min par IP) ────────────────────────────────
router.use(geocodingLimiter);

// ── Cache mémoire LRU (max 500 entrées, TTL 24h) ─────────────────────────
// Les noms de quartiers ne changent pas → TTL long acceptable.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;  // 24 heures
const CACHE_MAX    = 500;
const geocodeCache = new Map();

/**
 * Clé de cache arrondie à ~100m pour regrouper les positions proches.
 * 3 décimales ≈ 111m — suffisant pour identifier un quartier.
 */
function cacheKey(lat, lon, zoom) {
  return `${parseFloat(lat).toFixed(3)},${parseFloat(lon).toFixed(3)},${zoom}`;
}

function cacheGet(key) {
  const entry = geocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  // Éviction LRU basique : supprimer la plus ancienne entrée si plein
  if (geocodeCache.size >= CACHE_MAX) {
    const firstKey = geocodeCache.keys().next().value;
    geocodeCache.delete(firstKey);
  }
  geocodeCache.set(key, { data, ts: Date.now() });
}

// ── File d'attente Nominatim (max 1 requête simultanée + délai 1,1s) ──────
// Nominatim impose 1 req/s. On sérialise les appels pour ne jamais dépasser
// cette limite, quelle que soit la concurrence côté serveur.
let   nominatimQueue    = Promise.resolve();
const NOMINATIM_DELAY   = 1100; // ms — légère marge sur la limite 1 req/s

function enqueueNominatim(fn) {
  nominatimQueue = nominatimQueue
    .then(() => fn())
    .then(result =>
      new Promise(resolve => setTimeout(() => resolve(result), NOMINATIM_DELAY))
    )
    .catch(err =>
      new Promise((_, reject) => setTimeout(() => reject(err), NOMINATIM_DELAY))
    );
  return nominatimQueue;
}

// ── Appel Nominatim avec cache ────────────────────────────────────────────
async function nominatimReverse(lat, lon, zoom) {
  const key    = cacheKey(lat, lon, zoom);
  const cached = cacheGet(key);
  if (cached) {
    console.log(`🗂️  Cache hit géocodage: ${key}`);
    return cached;
  }

  const result = await enqueueNominatim(async () => {
    console.log(`🌍 Nominatim request: lat=${lat} lon=${lon} zoom=${zoom}`);
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format:         'json',
        lat,
        lon,
        zoom,
        addressdetails: 1
      },
      headers: {
        'Accept-Language': 'fr',
        'User-Agent':      'GazBF/1.0 (contact@gazbf.com)'
      },
      timeout: 8000
    });
    return response.data;
  });

  cacheSet(key, result);
  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// GET /api/geocoding/reverse
// Géocodage inversé simple (un seul zoom)
// ══════════════════════════════════════════════════════════════════════════
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon, zoom = 18 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    const data = await nominatimReverse(lat, lon, zoom);
    return res.json({ success: true, data });

  } catch (error) {
    console.error('❌ Erreur géocodage /reverse:', error.message);

    if (error.response?.status === 429) {
      return res.status(429).json({
        success:    false,
        message:    'Service de géocodage temporairement surchargé. Réessayez dans quelques secondes.',
        retryAfter: 5
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors du géocodage',
      error:   error.message
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /api/geocoding/multi-zoom
// Géocodage avec cascade de zooms pour trouver le meilleur quartier.
// ✅ N'appelle Nominatim qu'UNE SEULE FOIS si zoom 18 retourne déjà un quartier.
// ✅ Arrêt de la cascade sur 429 pour ne pas aggraver le rate limiting.
// ══════════════════════════════════════════════════════════════════════════
router.get('/multi-zoom', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    const zoomLevels = [18, 16, 14, 12];
    let   bestResult = null;

    for (const zoom of zoomLevels) {
      let data;
      try {
        data = await nominatimReverse(lat, lon, zoom);
      } catch (err) {
        console.warn(`⚠️  Erreur Nominatim zoom ${zoom}:`, err.message);

        // Sur 429 de Nominatim, arrêter immédiatement la cascade
        // pour ne pas multiplier les erreurs et vider la file d'attente
        if (err.response?.status === 429) {
          return res.status(429).json({
            success:    false,
            message:    'Service de géocodage temporairement surchargé. Réessayez dans quelques secondes.',
            retryAfter: 10
          });
        }
        continue; // autre erreur réseau → essayer le zoom suivant
      }

      const address = data?.address || {};

      const quarter =
        address.suburb        ||
        address.neighbourhood ||
        address.hamlet        ||
        address.quarter       ||
        address.city_district ||
        address.residential   ||
        null;

      if (quarter) {
        bestResult = { ...data, zoom, quarter };
        console.log(`✅ Quartier trouvé au zoom ${zoom}: ${quarter}`);
        break; // arrêt anticipé — pas besoin de descendre en zoom
      }

      console.log(`🔍 Zoom ${zoom}: pas de quartier, descente...`);
    }

    if (bestResult) {
      return res.json({ success: true, data: bestResult });
    }

    // Aucun quartier trouvé → retourner quand même le résultat zoom 18
    // (ville/pays disponibles, quartier null)
    try {
      const fallback = await nominatimReverse(lat, lon, 18);
      return res.json({
        success: true,
        data:    { ...fallback, zoom: 18, quarter: null },
        message: 'Aucun quartier trouvé'
      });
    } catch {
      return res.json({
        success: true,
        data:    null,
        message: 'Aucun quartier trouvé'
      });
    }

  } catch (error) {
    console.error('❌ Erreur multi-zoom:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du géocodage',
      error:   error.message
    });
  }
});

// ── Endpoint utilitaire : vider le cache (usage admin) ───────────────────
router.delete('/cache', (req, res) => {
  const size = geocodeCache.size;
  geocodeCache.clear();
  console.log(`🗑️  Cache géocodage vidé (${size} entrées supprimées)`);
  return res.json({
    success: true,
    message: `Cache vidé (${size} entrées)`
  });
});

module.exports = router;