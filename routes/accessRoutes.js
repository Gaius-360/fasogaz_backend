// ==========================================
// FICHIER: routes/accessRoutes.js
// ✅ REFONTE: Abonnement classique client
//    Supprimé: POST /purchase (direct)
//    Paiement → POST /api/payments/initiate { type: 'client_subscription' }
// ==========================================

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/accessController');
const { protect } = require('../middleware/auth');

// ── Routes publiques ───────────────────────────────────────────────────────
router.get('/pricing', controller.getPricing);

// ── Routes protégées ───────────────────────────────────────────────────────
router.use(protect);

const clientOnly = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
  }
  next();
};
router.use(clientOnly);

router.get('/status',  controller.checkAccessStatus);
router.get('/history', controller.getAccessHistory);
router.get('/stats',   controller.getAccessStats);

module.exports = router;