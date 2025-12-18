// ==========================================
// FICHIER: controllers/addressController.js
// ==========================================
const db = require('../models');
const ResponseHandler = require('../utils/responseHandler');

// @desc    Créer une adresse
// @route   POST /api/addresses
// @access  Private (client)
exports.createAddress = async (req, res) => {
  try {
    const { label, city, quarter, fullAddress, latitude, longitude, isDefault } = req.body;

    if (!label || !city || !quarter || !fullAddress) {
      return ResponseHandler.error(res, 'Tous les champs sont requis', 400);
    }

    // Si cette adresse doit être par défaut, retirer le défaut des autres
    if (isDefault) {
      await db.Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    const address = await db.Address.create({
      userId: req.user.id,
      label,
      city,
      quarter,
      fullAddress,
      latitude,
      longitude,
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

// @desc    Obtenir mes adresses
// @route   GET /api/addresses
// @access  Private (client)
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

// @desc    Mettre à jour une adresse
// @route   PUT /api/addresses/:id
// @access  Private (client)
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, city, quarter, fullAddress, latitude, longitude, isDefault } = req.body;

    const address = await db.Address.findByPk(id);

    if (!address) {
      return ResponseHandler.error(res, 'Adresse non trouvée', 404);
    }

    if (address.userId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    // Si cette adresse doit devenir par défaut
    if (isDefault && !address.isDefault) {
      await db.Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    const updates = {};
    if (label) updates.label = label;
    if (city) updates.city = city;
    if (quarter) updates.quarter = quarter;
    if (fullAddress) updates.fullAddress = fullAddress;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (isDefault !== undefined) updates.isDefault = isDefault;

    await address.update(updates);

    return ResponseHandler.success(res, 'Adresse mise à jour', address);
  } catch (error) {
    console.error('Erreur mise à jour adresse:', error);
    return ResponseHandler.error(res, 'Erreur lors de la mise à jour', 500);
  }
};

// @desc    Supprimer une adresse
// @route   DELETE /api/addresses/:id
// @access  Private (client)
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await db.Address.findByPk(id);

    if (!address) {
      return ResponseHandler.error(res, 'Adresse non trouvée', 404);
    }

    if (address.userId !== req.user.id) {
      return ResponseHandler.error(res, 'Non autorisé', 403);
    }

    await address.destroy();

    return ResponseHandler.success(res, 'Adresse supprimée');
  } catch (error) {
    console.error('Erreur suppression adresse:', error);
    return ResponseHandler.error(res, 'Erreur lors de la suppression', 500);
  }
};

module.exports = exports;