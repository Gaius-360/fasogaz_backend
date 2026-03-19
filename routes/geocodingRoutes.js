// ==========================================
// FICHIER: routes/geocodingRoutes.js
// ✅ FIX 429 DÉFINITIF côté serveur :
//    - Cache mémoire porté à 7 jours (quartiers ultra-stables)
//    - File d'attente Nominatim stricte 1.2s entre chaque appel
//    - Sur 429 Nominatim : arrêt immédiat de la cascade, Retry-After header
//    - Pas de cascade multi-zoom si zoom 18 retourne déjà un quartier
//    - Rate limiter dédié 20 req/min (aligné avec rateLimiter.js)
// ==========================================

const express              = require('express');
const router               = express.Router();
const axios                = require('axios');
const { geocodingLimiter } = require('../middleware/rateLimiter');

// ── Rate limiter dédié ────────────────────────────────────────────────────────
router.use(geocodingLimiter);

// ── Cache mémoire LRU (max 1000 entrées, TTL 7 jours) ────────────────────────
// Les quartiers ne bougent pratiquement jamais → TTL très long = moins d'appels
// Nominatim = moins de 429.
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const CACHE_MAX    = 1000;
const geocodeCache = new Map();

function cacheKey(lat, lon, zoom) {
  // 2 décimales ≈ 1.1km — même granularité que le client pour maximiser les hits
  return `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)},${zoom}`;
}

function cacheGet(key) {
  const entry = geocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return null;
  }
  // Rafraîchir la position LRU
  geocodeCache.delete(key);
  geocodeCache.set(key, entry);
  return entry.data;
}

function cacheSet(key, data) {
  if (geocodeCache.size >= CACHE_MAX) {
    const firstKey = geocodeCache.keys().next().value;
    geocodeCache.delete(firstKey);
  }
  geocodeCache.set(key, { data, ts: Date.now() });
}

// ── File d'attente Nominatim (1 requête à la fois, délai 1.2s) ───────────────
// Nominatim impose 1 req/s. On sérialise + on ajoute 200ms de marge.
// CRITIQUE : toutes les requêtes passent par cette file, même si elles viennent
// de plusieurs utilisateurs simultanément.
let   nominatimQueue  = Promise.resolve();
const NOMINATIM_DELAY = 1200;

// Compteur de requêtes Nominatim en attente — si trop de requêtes s'accumulent,
// on retourne une erreur 429 immédiatement sans attendre.
let nominatimQueueDepth = 0;
const MAX_QUEUE_DEPTH   = 5; // max 5 requêtes en attente simultanément

function enqueueNominatim(fn) {
  nominatimQueueDepth++;
  nominatimQueue = nominatimQueue
    .then(() => {
      nominatimQueueDepth = Math.max(0, nominatimQueueDepth - 1);
      return fn();
    })
    .then(result =>
      new Promise(resolve => setTimeout(() => resolve(result), NOMINATIM_DELAY))
    )
    .catch(err =>
      new Promise((_, reject) => setTimeout(() => reject(err), NOMINATIM_DELAY))
    );
  return nominatimQueue;
}

// ── Appel Nominatim avec cache ────────────────────────────────────────────────
async function nominatimReverse(lat, lon, zoom) {
  const key    = cacheKey(lat, lon, zoom);
  const cached = cacheGet(key);

  if (cached) {
    console.log(`🗂️  [geocoding] Cache hit: ${key}`);
    return cached;
  }

  const result = await enqueueNominatim(async () => {
    console.log(`🌍 [geocoding] Nominatim: lat=${parseFloat(lat).toFixed(4)} lon=${parseFloat(lon).toFixed(4)} zoom=${zoom}`);
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'json', lat, lon, zoom, addressdetails: 1 },
      headers: {
        'Accept-Language': 'fr',
        'User-Agent':      'FasoGaz/1.0 (contact@fasogaz.com)'
      },
      timeout: 8000
    });
    return response.data;
  });

  cacheSet(key, result);
  return result;
}

// ── Helper : extraire le quartier d'une réponse Nominatim ────────────────────
function extractQuarter(address) {
  return (
    address.suburb        ||
    address.neighbourhood ||
    address.hamlet        ||
    address.quarter       ||
    address.city_district ||
    address.residential   ||
    null
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/geocoding/reverse
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
    console.error('❌ [geocoding] /reverse:', error.message);

    if (error.response?.status === 429) {
      return res.status(429)
        .set('Retry-After', '300')
        .json({
          success:    false,
          message:    'Service de géocodage surchargé. Réessayez dans 5 minutes.',
          retryAfter: 300
        });
    }

    return res.status(500).json({ success: false, message: 'Erreur lors du géocodage', error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/geocoding/multi-zoom
// Cascade de zooms pour trouver le meilleur quartier.
// ✅ Arrêt anticipé dès zoom 18 si quartier trouvé (cas le plus fréquent).
// ✅ Rejet immédiat si file trop longue (évite d'aggraver le 429).
// ══════════════════════════════════════════════════════════════════════════════
router.get('/multi-zoom', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude et longitude requises' });
    }

    // Rejet anticipé si trop de requêtes en attente dans la file Nominatim
    if (nominatimQueueDepth >= MAX_QUEUE_DEPTH) {
      console.warn(`⚠️ [geocoding] File saturée (${nominatimQueueDepth} en attente) — rejet anticipé`);
      return res.status(429)
        .set('Retry-After', '10')
        .json({
          success:    false,
          message:    'Service momentanément surchargé. Réessayez dans quelques secondes.',
          retryAfter: 10
        });
    }

    // ── Zoom 18 en premier — couvre 95% des cas ───────────────────────────
    let zoom18Data;
    try {
      zoom18Data = await nominatimReverse(lat, lon, 18);
    } catch (err) {
      if (err.response?.status === 429) {
        return res.status(429)
          .set('Retry-After', '300')
          .json({
            success:    false,
            message:    'Service de géocodage surchargé. Réessayez dans 5 minutes.',
            retryAfter: 300
          });
      }
      // Erreur réseau → retour dégradé sans cascader
      return res.json({ success: true, data: null, message: 'Erreur réseau Nominatim' });
    }

    const quarter18 = extractQuarter(zoom18Data?.address || {});

    if (quarter18) {
      console.log(`✅ [geocoding] Quartier trouvé zoom 18: ${quarter18}`);
      return res.json({ success: true, data: { ...zoom18Data, zoom: 18 } });
    }

    // ── Zoom 18 sans quartier → cascade 16, 14, 12 ───────────────────────
    const fallbackZooms = [16, 14, 12];

    for (const zoom of fallbackZooms) {
      let data;
      try {
        data = await nominatimReverse(lat, lon, zoom);
      } catch (err) {
        if (err.response?.status === 429) {
          // Arrêt de la cascade sur 429 — retourner zoom18Data (partiel)
          console.warn(`⚠️ [geocoding] 429 au zoom ${zoom} — arrêt cascade`);
          return res.json({
            success: true,
            data:    { ...zoom18Data, zoom: 18, quarter: null },
            message: 'Quartier non trouvé (rate limit)'
          });
        }
        continue;
      }

      const quarter = extractQuarter(data?.address || {});
      if (quarter) {
        console.log(`✅ [geocoding] Quartier trouvé zoom ${zoom}: ${quarter}`);
        return res.json({ success: true, data: { ...data, zoom } });
      }

      console.log(`🔍 [geocoding] Zoom ${zoom}: pas de quartier`);
    }

    // Aucun quartier trouvé → retourner zoom18 (ville disponible)
    return res.json({
      success: true,
      data:    { ...zoom18Data, zoom: 18, quarter: null },
      message: 'Aucun quartier trouvé'
    });

  } catch (error) {
    console.error('❌ [geocoding] /multi-zoom:', error.message);
    return res.status(500).json({ success: false, message: 'Erreur lors du géocodage', error: error.message });
  }
});

// ── Vider le cache (usage admin) ─────────────────────────────────────────────
router.delete('/cache', (req, res) => {
  const size = geocodeCache.size;
  geocodeCache.clear();
  nominatimQueueDepth = 0;
  console.log(`🗑️  [geocoding] Cache vidé (${size} entrées)`);
  return res.json({ success: true, message: `Cache vidé (${size} entrées)` });
});

// ── Stats du cache (usage debug) ─────────────────────────────────────────────
router.get('/cache/stats', (req, res) => {
  return res.json({
    success:    true,
    cacheSize:  geocodeCache.size,
    cacheMax:   CACHE_MAX,
    ttlDays:    CACHE_TTL_MS / (24 * 60 * 60 * 1000),
    queueDepth: nominatimQueueDepth,
    maxQueue:   MAX_QUEUE_DEPTH,
  });
});

module.exports = router;