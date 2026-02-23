const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Toutes les routes nécessitent authentification
router.use(protect);

// Plans disponibles
router.get('/plans', subscriptionController.getPlans);

// Créer abonnement
router.post('/', subscriptionController.createSubscription);

// Mon abonnement
router.get('/my-subscription', subscriptionController.getMySubscription);

// Renouvellement anticipé (une seule fois avant expiration)
router.put('/early-renewal', subscriptionController.earlyRenewal);

// Renouveler
router.put('/renew', subscriptionController.renewSubscription);

// Suppression immédiate
router.delete('/', subscriptionController.deleteSubscription);

module.exports = router;