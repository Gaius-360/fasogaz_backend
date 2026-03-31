// ==========================================
// FICHIER: server.js
// ✅ VERSION FINALE — Rate limiting global actif
// ✅ AJOUT: cookie-parser pour les refresh tokens httpOnly
// ✅ FIX CROSS-DOMAIN: CORS configuré pour envoyer les cookies
//    entre app.fasogaz.com (frontend) et api.fasogaz.com (backend)
// ✅ FIX SIMULATION: localhost:5000 ajouté aux origines autorisées
//    (la page de simulation est servie par le backend lui-même)
// ==========================================

const express      = require('express');
const dotenv       = require('dotenv');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const db           = require('./models');
const errorHandler = require('./middleware/errorHandler');

const { startSubscriptionJobs }    = require('./jobs/subscriptionJobs');
const { startNotificationJobs }    = require('./jobs/notificationJobs');
const { startOrderExpirationJobs } = require('./jobs/orderExpirationJob');

const { globalApiLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();

// ==========================================
// CORS
// ✅ FIX CROSS-DOMAIN: credentials: true + origins explicites (jamais *)
//
// Règle du navigateur :
//   withCredentials: true (côté client)  +  credentials: true (côté serveur)
//   + origin EXACTE (pas de wildcard *)  =  cookie envoyé
//
// Si l'une de ces 3 conditions manque → le cookie est silencieusement bloqué
// et POST /auth/refresh arrive sans cookie → 401 → déconnexion
// ==========================================
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev frontend
  'http://localhost:4173',   // Vite preview
  'http://localhost:5000',   // ✅ Backend lui-même (pages simulation LigdiCash)
  'http://localhost:3000',   // React dev alternatif
  'https://fasogaz.onrender.com',
  process.env.FRONTEND_URL,  // ex: https://app.fasogaz.com  ← doit être dans le .env
  process.env.BACKEND_URL,   // ✅ URL backend production (pages simulation en prod)
].filter(Boolean);           // retire les undefined si variables non définies

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, curl, apps mobiles natives,
    // et les appels serveur→serveur internes comme le webhook callback)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // En dev, logger l'origine bloquée pour faciliter le debug
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  CORS bloqué pour l'origine: ${origin}`);
      console.warn(`    Origines autorisées: ${allowedOrigins.join(', ')}`);
    }

    callback(new Error(`CORS bloqué pour l'origine: ${origin}`));
  },
  credentials: true, // ✅ OBLIGATOIRE — sans ça le cookie n'est pas transmis
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Répondre explicitement aux preflight OPTIONS
// Certains proxys ou CDN bloquent les OPTIONS sans ce handler
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Doit être AVANT les routes pour parser req.cookies

// ✅ Rate limit global sur toutes les routes /api (100 req / 15 min)
app.use('/api', globalApiLimiter);

// ==========================================
// ROUTES UTILITAIRES
// ==========================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API GAZBF v2.0 - Serveur opérationnel',
    version: '2.0.0'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ success: true, message: '✅ Base de données connectée' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Erreur BDD',
      error: error.message
    });
  }
});

// ==========================================
// ROUTES API
// Les rate limiters spécifiques sont dans chaque fichier de routes
// ==========================================
app.use('/api/auth',           require('./routes/authRoutes'));
app.use('/api/products',       require('./routes/productRoutes'));
app.use('/api/orders',         require('./routes/orderRoutes'));
app.use('/api/subscriptions',  require('./routes/subscriptionRoutes'));
app.use('/api/reviews',        require('./routes/reviewRoutes'));
app.use('/api/addresses',      require('./routes/addressRoutes'));
app.use('/api/seller',         require('./routes/sellerRoutes'));
app.use('/api/admin/auth',     require('./routes/adminAuthRoutes'));
app.use('/api/admin',          require('./routes/adminRoutes'));
app.use('/api/pricing',        require('./routes/pricingRoutes'));
app.use('/api/access',         require('./routes/accessRoutes'));
app.use('/api/admin/pricing',  require('./routes/adminPricingRoutes'));
app.use('/api/notifications',  require('./routes/notificationRoutes'));
app.use('/api/invitations',    require('./routes/invitationRoutes'));
app.use('/api/auth',           require('./routes/sellerAuthRoutes'));
app.use('/api/agent/auth',     require('./routes/agentAuthRoutes'));
app.use('/api/payments',       require('./routes/paymentRoutes'));
app.use('/api/geocoding',      require('./routes/geocodingRoutes'));
app.use('/api/push',           require('./routes/pushRoutes'));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

app.use(errorHandler);

// ==========================================
// DÉMARRAGE
// ==========================================
const PORT = process.env.PORT || 5000;

db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Connexion PostgreSQL établie');

    db.sequelize.sync({ alter: false }).then(() => {
      console.log('✅ Modèles synchronisés');
    });

    startSubscriptionJobs();
    startNotificationJobs();
    startOrderExpirationJobs();

    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 API GAZBF v2.0 démarrée`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Port        : ${PORT}`);
      console.log(`🌍 Env         : ${process.env.NODE_ENV}`);
      console.log(`🛡️  Rate limit  : ACTIF (global + par route)`);
      console.log(`🔐 Admin BDD   : ACTIF (plus de hardcoding)`);
      console.log(`🍪 Cookies     : ACTIF (sameSite=None, cross-domain)`);
      console.log(`🌐 Origins     : ${allowedOrigins.join(', ')}`);
      console.log(`${'='.repeat(60)}\n`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur connexion PostgreSQL:', err.message);
    process.exit(1);
  });