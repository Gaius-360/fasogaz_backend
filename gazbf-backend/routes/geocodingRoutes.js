// ==========================================
// FICHIER: routes/geocodingRoutes.js (NOUVEAU)
// Routes pour le géocodage inversé
// ==========================================

const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @route   GET /api/geocoding/reverse
 * @desc    Géocodage inversé via Nominatim (proxy pour éviter CORS)
 * @access  Public
 */
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon, zoom = 18 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    console.log(`📍 Géocodage inversé: ${lat}, ${lon} (zoom: ${zoom})`);

    // Appeler Nominatim depuis le backend (pas de CORS)
    const url = `https://nominatim.openstreetmap.org/reverse`;
    
    const response = await axios.get(url, {
      params: {
        format: 'json',
        lat,
        lon,
        zoom,
        addressdetails: 1
      },
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'GazBF/1.0 (contact@gazbf.com)'
      },
      timeout: 10000
    });

    console.log('✅ Réponse Nominatim reçue');

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('❌ Erreur géocodage:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du géocodage',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/geocoding/multi-zoom
 * @desc    Géocodage avec plusieurs niveaux de zoom
 * @access  Public
 */
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
    let bestResult = null;

    // Essayer chaque zoom jusqu'à trouver un quartier
    for (const zoom of zoomLevels) {
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            format: 'json',
            lat,
            lon,
            zoom,
            addressdetails: 1
          },
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'GazBF/1.0 (contact@gazbf.com)'
          },
          timeout: 5000
        });

        const address = response.data.address || {};
        
        // Vérifier si un quartier est trouvé
        const quarter = 
          address.suburb ||
          address.neighbourhood ||
          address.hamlet ||
          address.quarter ||
          address.city_district ||
          address.residential ||
          null;

        if (quarter) {
          bestResult = {
            ...response.data,
            zoom,
            quarter
          };
          console.log(`✅ Quartier trouvé au zoom ${zoom}: ${quarter}`);
          break;
        }

      } catch (error) {
        console.warn(`⚠️ Erreur zoom ${zoom}:`, error.message);
        continue;
      }
    }

    if (bestResult) {
      return res.json({
        success: true,
        data: bestResult
      });
    } else {
      return res.json({
        success: true,
        data: null,
        message: 'Aucun quartier trouvé'
      });
    }

  } catch (error) {
    console.error('❌ Erreur multi-zoom:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du géocodage',
      error: error.message
    });
  }
});

module.exports = router;