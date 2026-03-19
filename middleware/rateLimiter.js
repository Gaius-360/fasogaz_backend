// ==========================================
// FICHIER: middleware/rateLimiter.js
// Protection contre le brute force sur les routes sensibles
// Dépendance : npm install express-rate-limit
// ==========================================

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit'); // ✅ helper IPv6

// Helper : message avec délai restant
const handler = (req, res) => {
  const retry = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60);
  res.status(429).json({
    success: false,
    message: `Trop de tentatives. Réessayez dans ${retry} minute(s).`
  });
};

// Fonction clé IPv6 + custom prefix
const makeKey = (prefix) => (req) => `${prefix}_${ipKeyGenerator(req)}`;

// LOGIN ADMIN : 5 tentatives / 15 min
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: makeKey('admin_login')
});

// LOGIN AGENT : 10 tentatives / 15 min
const agentLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: makeKey('agent_login')
});

// LOGIN CLIENT/REVENDEUR : 10 tentatives / 15 min
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: makeKey('auth_login')
});

// OTP (forgot-password, resend-otp) : 5 / 10 min — anti SMS flooding
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: (req) =>
    `otp_${ipKeyGenerator(req)}_${req.body?.phone || 'unknown'}`
});

// VERIFY OTP / RESET PASSWORD : 5 / 10 min — anti brute force code 6 chiffres
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: (req) =>
    `otp_verify_${ipKeyGenerator(req)}_${req.body?.phone || 'unknown'}`
});

// INSCRIPTION : 5 comptes / heure par IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: 'Trop d\'inscriptions depuis cette adresse. Réessayez dans 1 heure.'
    }),
  keyGenerator: makeKey('register')
});

// GLOBAL API : 100 requêtes / 15 min (filet de sécurité général)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: (req) => req.path === '/api/health',
  keyGenerator: ipKeyGenerator // fallback IPv6 pour toutes les routes
});

module.exports = {
  adminLoginLimiter,
  agentLoginLimiter,
  authLoginLimiter,
  otpLimiter,
  otpVerifyLimiter,
  registerLimiter,
  globalApiLimiter
};