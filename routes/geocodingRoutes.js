// ==========================================
// FICHIER: routes/geocodingRoutes.js
// ✅ FIX 429: Rate limiter Nominatim + cache mémoire LRU simple
//    - Cache TTL: 24h (les quartiers ne bougent pas)
//    - File d'attente: une seule requête Nominatim à la fois (pas de burst)
//    - Rate limit express: 60 req/min par IP sur cette route
// ==========================================

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// ── Rate limiter express (optionnel si express-rate-limit est installé) ──────
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch {
  rateLimit = null;
}

if (rateLimit) {
  const geocodingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max:      60,        // 60 requêtes par minute par IP
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, message: 'Trop de requêtes, réessayez dans une minute.' }
  });
  router.use(geocodingLimiter);
}

// ── Cache mémoire simple (LRU manuel, max 500 entrées, TTL 24h) ──────────────
const CACHE_TTL_MS  = 24 * 60 * 60 * 1000; // 24 heures
const CACHE_MAX     = 500;
const geocodeCache  = new Map();

/**
 * Clé de cache arrondie à ~100m pour regrouper les positions proches.
 * 3 décimales ≈ 111m de précision — suffisant pour un quartier.
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

// ── File d'attente : max 1 requête Nominatim simultanée + délai 1s ───────────
// Nominatim impose 1 req/s max. On sérialise les appels avec une file.
let nominatimQueue   = Promise.resolve();
const NOMINATIM_DELAY = 1100; // ms entre deux appels (légère marge sur 1s)

function enqueueNominatim(fn) {
  nominatimQueue = nominatimQueue
    .then(() => fn())
    .then(result => {
      // Attendre le délai avant de libérer la file pour la prochaine requête
      return new Promise(resolve => setTimeout(() => resolve(result), NOMINATIM_DELAY));
    })
    .catch(err => {
      return new Promise((_, reject) => setTimeout(() => reject(err), NOMINATIM_DELAY));
    });
  return nominatimQueue;
}

// ── Helper : appel Nominatim avec cache ──────────────────────────────────────
async function nominatimReverse(lat, lon, zoom) {
  const key    = cacheKey(lat, lon, zoom);
  const cached = cacheGet(key);
  if (cached) {
    console.log(`🗂️ Cache hit géocodage: ${key}`);
    return cached;
  }

  // Pas en cache → mettre en file d'attente
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

// ══════════════════════════════════════════════════════════════════════════════
// @route   GET /api/geocoding/reverse
// @desc    Géocodage inversé simple (un seul zoom)
// @access  Public
// ══════════════════════════════════════════════════════════════════════════════
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon, zoom = 18 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude et longitude requises' });
    }

    const data = await nominatimReverse(lat, lon, zoom);

    return res.json({ success: true, data });

  } catch (error) {
    console.error('❌ Erreur géocodage /reverse:', error.message);

    // Transmettre le 429 de Nominatim tel quel si c'est lui qui rate-limite
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Service de géocodage temporairement surchargé. Réessayez dans quelques secondes.'
      });
    }

    return res.status(500).json({ success: false, message: 'Erreur lors du géocodage', error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// @route   GET /api/geocoding/multi-zoom
// @desc    Géocodage avec cascade de zooms pour trouver le meilleur quartier
//          ✅ N'appelle Nominatim qu'UNE SEULE FOIS si le zoom 18 retourne déjà un quartier
// @access  Public
// ══════════════════════════════════════════════════════════════════════════════
router.get('/multi-zoom', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude et longitude requises' });
    }

    const zoomLevels = [18, 16, 14, 12];
    let bestResult   = null;

    for (const zoom of zoomLevels) {
      let data;
      try {
        data = await nominatimReverse(lat, lon, zoom);
      } catch (err) {
        console.warn(`⚠️ Erreur Nominatim zoom ${zoom}:`, err.message);
        // Si 429 → arrêter la cascade pour ne pas aggraver
        if (err.response?.status === 429) {
          return res.status(429).json({
            success: false,
            message: 'Service de géocodage temporairement surchargé. Réessayez dans quelques secondes.'
          });
        }
        continue;
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
        break; // ← arrêt anticipé dès qu'un quartier est trouvé
      }

      console.log(`🔍 Zoom ${zoom}: pas de quartier, on descend...`);
    }

    if (bestResult) {
      return res.json({ success: true, data: bestResult });
    }

    // Aucun quartier trouvé même au zoom le plus bas → retourner quand même le résultat zoom 18
    // (pour avoir au moins ville/pays)
    try {
      const fallback = await nominatimReverse(lat, lon, 18);
      return res.json({
        success: true,
        data:    { ...fallback, zoom: 18, quarter: null },
        message: 'Aucun quartier trouvé'
      });
    } catch {
      return res.json({ success: true, data: null, message: 'Aucun quartier trouvé' });
    }

  } catch (error) {
    console.error('❌ Erreur multi-zoom:', error.message);
    return res.status(500).json({ success: false, message: 'Erreur lors du géocodage', error: error.message });
  }
});

// ── Endpoint utilitaire : vider le cache (admin uniquement si besoin) ─────────
router.delete('/cache', (req, res) => {
  const size = geocodeCache.size;
  geocodeCache.clear();
  console.log(`🗑️ Cache géocodage vidé (${size} entrées supprimées)`);
  return res.json({ success: true, message: `Cache vidé (${size} entrées)` });
});

module.exports = router;