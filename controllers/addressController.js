// ==========================================
// FICHIER: controllers/addressController.js
// ✅ MODIFIÉ: Ajout du champ quarter (création + mise à jour)
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
      quarter,       // ✅ NOUVEAU
      latitude,
      longitude,
      phoneNumber,
      additionalInfo,
      isDefault
    } = req.body;

    if (!label || !city) {
      return ResponseHandler.error(res, 'Le nom et la ville sont obligatoires', 400);
    }
    if (!latitude || !longitude) {
      return ResponseHandler.error(res, 'Les coordonnées GPS sont obligatoires', 400);
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return ResponseHandler.error(res, 'Latitude invalide (doit être entre -90 et 90)', 400);
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return ResponseHandler.error(res, 'Longitude invalide (doit être entre -180 et 180)', 400);
    }

    // ✅ fullAddress inclut le quartier s'il est disponible
    const fullAddress = quarter ? `${quarter}, ${city}` : city;

    if (isDefault) {
      await db.Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    const address = await db.Address.create({
      userId: req.user.id,
      label,
      fullAddress,
      city,
      quarter:        quarter || null,   // ✅ NOUVEAU
      latitude:       lat,
      longitude:      lon,
      phoneNumber,
      additionalInfo,
      isDefault:      isDefault || false
    });

    return ResponseHandler.success(res, 'Adresse créée avec succès', address, 201);
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
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    return ResponseHandler.success(res, 'Adresses récupérées', addresses);
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
    const address = await db.Address.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!address) return ResponseHandler.error(res, 'Adresse non trouvée', 404);
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
    const address = await db.Address.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!address) return ResponseHandler.error(res, 'Adresse non trouvée', 404);

    const {
      label,
      city,
      quarter,       // ✅ NOUVEAU
      latitude,
      longitude,
      phoneNumber,
      additionalInfo,
      isDefault
    } = req.body;

    const updates = {};

    if (label          !== undefined) updates.label          = label;
    if (city           !== undefined) updates.city           = city;
    if (quarter        !== undefined) updates.quarter        = quarter || null;  // ✅ NOUVEAU
    if (phoneNumber    !== undefined) updates.phoneNumber    = phoneNumber;
    if (additionalInfo !== undefined) updates.additionalInfo = additionalInfo;

    if (latitude !== undefined && latitude !== null) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90)
        return ResponseHandler.error(res, 'Latitude invalide', 400);
      updates.latitude = lat;
    }
    if (longitude !== undefined && longitude !== null) {
      const lon = parseFloat(longitude);
      if (isNaN(lon) || lon < -180 || lon > 180)
        return ResponseHandler.error(res, 'Longitude invalide', 400);
      updates.longitude = lon;
    }

    // ✅ Reconstruire fullAddress avec le quartier éventuel
    const newCity    = city    ?? address.city;
    const newQuarter = quarter ?? address.quarter;
    updates.fullAddress = newQuarter ? `${newQuarter}, ${newCity}` : newCity;

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

    return ResponseHandler.success(res, 'Adresse mise à jour', address);
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
    const address = await db.Address.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!address) return ResponseHandler.error(res, 'Adresse non trouvée', 404);
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
    const address = await db.Address.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!address) return ResponseHandler.error(res, 'Adresse non trouvée', 404);

    await db.Address.update(
      { isDefault: false },
      { where: { userId: req.user.id } }
    );
    await address.update({ isDefault: true });

    return ResponseHandler.success(res, 'Adresse définie par défaut', address);
  } catch (error) {
    console.error('Erreur définition adresse par défaut:', error);
    return ResponseHandler.error(res, "Erreur lors de l'opération", 500);
  }
};