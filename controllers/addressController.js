// ==========================================
// FICHIER: controllers/addressController.js
// Contrôleur des adresses avec GPS automatique
// ==========================================

const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Créer une adresse
// @route   POST /api/addresses
// @access  Private
exports.createAddress = async (req, res) => {
  try {
    const {
      label,
      city,
      latitude,
      longitude,
      phoneNumber,
      additionalInfo,
      isDefault
    } = req.body;

    // Validation
    if (!label || !city) {
      return ResponseHandler.error(
        res,
        'Le nom et la ville sont obligatoires',
        400
      );
    }

    // Validation GPS
    if (!latitude || !longitude) {
      return ResponseHandler.error(
        res,
        'Les coordonnées GPS sont obligatoires',
        400
      );
    }

    // Validation des coordonnées GPS
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return ResponseHandler.error(
        res,
        'Latitude invalide (doit être entre -90 et 90)',
        400
      );
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      return ResponseHandler.error(
        res,
        'Longitude invalide (doit être entre -180 et 180)',
        400
      );
    }

    // ✅ Générer automatiquement fullAddress (ville uniquement)
    const fullAddress = city;

    // Si isDefault est true, mettre à jour les autres adresses
    if (isDefault) {
      await db.Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    const address = await db.Address.create({
      userId: req.user.id,
      label,
      fullAddress, // Généré automatiquement
      city,
      latitude: lat,
      longitude: lon,
      phoneNumber,
      additionalInfo,
      isDefault: isDefault || false
    });

    return ResponseHandler.success(
      res,
      'Adresse créée avec succès',
      address,
      201
    );
  } catch (error) {
    console.error('Erreur création adresse:', error);
    return ResponseHandler.error(res, 'Erreur lors de la création', 500);
  }
};

// @desc    Obtenir toutes mes adresses
// @route   GET /api/addresses
// @access  Private
exports.getMyAddresses = async (req, res) => {
  try {
    const addresses = await db.Address.findAll({
      where: { userId: req.user.id },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    return ResponseHandler.success(
      res,
      'Adresses récupérées',
      addresses
    );
  } catch (error) {
    console.error('Erreur récupération adresses:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Obtenir une adresse par ID
// @route   GET /api/addresses/:id
// @access  Private
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await db.Address.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!address) {
      return ResponseHandler.error(res, 'Adresse non trouvée', 404);
    }

    return ResponseHandler.success(res, 'Adresse récupérée', address);
  } catch (error) {
    console.error('Erreur récupération adresse:', error);
    return ResponseHandler.error(res, 'Erreur lors de la récupération', 500);
  }
};

// @desc    Mettre à jour une adresse
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await db.Address.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!address) {
      return ResponseHandler.error(res, 'Adresse non trouvée', 404);
    }

    const {
      label,
      city,
      latitude,
      longitude,
      phoneNumber,
      additionalInfo,
      isDefault
    } = req.body;

    const updates = {};

    // Champs de base
    if (label !== undefined) updates.label = label;
    if (city !== undefined) updates.city = city;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (additionalInfo !== undefined) updates.additionalInfo = additionalInfo;

    // Coordonnées GPS
    if (latitude !== undefined && latitude !== null) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return ResponseHandler.error(
          res,
          'Latitude invalide (doit être entre -90 et 90)',
          400
        );
      }
      updates.latitude = lat;
    }

    if (longitude !== undefined && longitude !== null) {
      const lon = parseFloat(longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        return ResponseHandler.error(
          res,
          'Longitude invalide (doit être entre -180 et 180)',
          400
        );
      }
      updates.longitude = lon;
    }

    // ✅ Régénérer fullAddress si city change (ville uniquement)
    const newCity = city || address.city;
    updates.fullAddress = newCity;

    // Si isDefault est défini
    if (isDefault !== undefined) {
      if (isDefault) {
        await db.Address.update(
          { isDefault: false },
          { where: { userId: req.user.id } }
        );
      }
      updates.isDefault = isDefault;
    }

    await address.update(updates);

    return ResponseHandler.success(
      res,
      'Adresse mise à jour',
      address
    );
  } catch (error) {
    console.error('Erreur mise à jour adresse:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// @desc    Supprimer une adresse
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await db.Address.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!address) {
      return ResponseHandler.error(res, 'Adresse non trouvée', 404);
    }

    await address.destroy();

    return ResponseHandler.success(res, 'Adresse supprimée');
  } catch (error) {
    console.error('Erreur suppression adresse:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

// @desc    Définir une adresse par défaut
// @route   PUT /api/addresses/:id/set-default
// @access  Private
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await db.Address.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!address) {
      return ResponseHandler.error(res, 'Adresse non trouvée', 404);
    }

    // Retirer le statut par défaut de toutes les adresses
    await db.Address.update(
      { isDefault: false },
      { where: { userId: req.user.id } }
    );

    // Définir cette adresse comme par défaut
    await address.update({ isDefault: true });

    return ResponseHandler.success(
      res,
      'Adresse définie par défaut',
      address
    );
  } catch (error) {
    console.error('Erreur définition adresse par défaut:', error);
    return ResponseHandler.error(res, 'Erreur lors de l\'opération', 500);
  }
};