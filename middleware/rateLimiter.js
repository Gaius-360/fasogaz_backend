// ==========================================
// FICHIER: middleware/rateLimiter.js
// ✅ Ajout de geocodingLimiter (20 req/min par IP) — dédié à /api/geocoding
//    (aligné sur le commentaire de geocodingRoutes.js, était 30 avant)
// Protection contre le brute force sur les routes sensibles
// Dépendance : npm install express-rate-limit
// ==========================================

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// ── Helper : réponse 429 avec délai restant ────────────────────────────────
const handler = (req, res) => {
  const retry = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60);
  res.status(429).json({
    success: false,
    message: `Trop de tentatives. Réessayez dans ${retry} minute(s).`
  });
};

// ── Helper : clé IP avec préfixe (namespace par route) ────────────────────
const makeKey = (prefix) => (req) => `${prefix}_${ipKeyGenerator(req)}`;

// ── LOGIN ADMIN : 5 tentatives / 15 min ───────────────────────────────────
const adminLoginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  keyGenerator:    makeKey('admin_login')
});

// ── LOGIN AGENT : 10 tentatives / 15 min ──────────────────────────────────
const agentLoginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  keyGenerator:    makeKey('agent_login')
});

// ── LOGIN CLIENT/REVENDEUR : 10 tentatives / 15 min ───────────────────────
const authLoginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  keyGenerator:    makeKey('auth_login')
});

// ── OTP (forgot-password, resend-otp) : 5 / 10 min — anti SMS flooding ───
const otpLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  keyGenerator:    (req) =>
    `otp_${ipKeyGenerator(req)}_${req.body?.phone || 'unknown'}`
});

// ── VERIFY OTP / RESET PASSWORD : 5 / 10 min — anti brute force ──────────
const otpVerifyLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  keyGenerator:    (req) =>
    `otp_verify_${ipKeyGenerator(req)}_${req.body?.phone || 'unknown'}`
});

// ── INSCRIPTION : 5 comptes / heure par IP ────────────────────────────────
const registerLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         (req, res) =>
    res.status(429).json({
      success: false,
      message: "Trop d'inscriptions depuis cette adresse. Réessayez dans 1 heure."
    }),
  keyGenerator:    makeKey('register')
});

// ── GLOBAL API : 100 req / 15 min (filet de sécurité général) ─────────────
// Note : /api/geocoding a son propre limiter plus généreux ci-dessous,
// mais reste tout de même soumis à ce plafond global.
const globalApiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  skip:            (req) => req.path === '/api/health',
  keyGenerator:    ipKeyGenerator
});

// ── GÉOCODAGE : 20 req/min par IP ─────────────────────────────────────────
// Séparé du globalApiLimiter pour deux raisons :
//  1. Le géocodage est déclenché automatiquement (watchPosition) et non
//     par l'utilisateur → il a besoin d'un quota plus généreux sur 1 minute.
//  2. Nominatim impose 1 req/s. Le backend sérialise déjà les appels via
//     une file d'attente (nominatimQueue). Ce limiter protège la file contre
//     un burst côté client qui ferait déborder la queue mémoire.
//
// 20 req/min = 1 req/3s en moyenne, compatible avec la contrainte Nominatim
// et largement suffisant pour un usage normal (déplacement utilisateur).
//
// ✅ Aligné à 20 (était 30) pour correspondre au commentaire de geocodingRoutes.js
//    et renforcer la protection contre les bursts côté client.
const geocodingLimiter = rateLimit({
  windowMs:        60 * 1000,   // fenêtre de 1 minute
  max:             20,           // ✅ 20 requêtes par minute par IP (était 30)
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         (req, res) => {
    const retryAfterMs = req.rateLimit.resetTime - Date.now();
    res.status(429).json({
      success:    false,
      message:    'Service de géocodage temporairement surchargé. Réessayez dans quelques secondes.',
      retryAfter: Math.ceil(retryAfterMs / 1000)   // secondes, lisible par le client
    });
  },
  keyGenerator:    makeKey('geocoding')
});

module.exports = {
  adminLoginLimiter,
  agentLoginLimiter,
  authLoginLimiter,
  otpLimiter,
  otpVerifyLimiter,
  registerLimiter,
  globalApiLimiter,
  geocodingLimiter
};