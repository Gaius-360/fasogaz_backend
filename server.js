// ==========================================
// FICHIER: server.js - VERSION COMPLÈTE AVEC EXPIRATION
// ==========================================
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler');
const { startSubscriptionJobs } = require('./jobs/subscriptionJobs');
const { startNotificationJobs } = require('./jobs/notificationJobs');
const { startOrderExpirationJobs } = require('./jobs/orderExpirationJob');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://fasogaz.onrender.com',          // ✅ nouvelle URL
  process.env.FRONTEND_URL,                
].filter(Boolean); // supprime les valeurs undefined/null

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, mobile natif)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqué pour l'origine: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API GAZBF v2.0 - Serveur opérationnel',
    version: '2.0.0',
    database: 'MySQL + Sequelize',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      subscriptions: '/api/subscriptions',
      reviews: '/api/reviews',
      addresses: '/api/addresses',
      notifications: '/api/notifications'
    }
  });
});

// Route de test de connexion DB
app.get('/api/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({
      success: true,
      message: '✅ Base de données connectée',
      database: db.sequelize.config.database
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Erreur de connexion à la base de données',
      error: error.message
    });
  }
});

// ==========================================
// ROUTES API
// ==========================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/pricing', require('./routes/pricingRoutes'));
app.use('/api/access', require('./routes/accessRoutes'));
app.use('/api/admin/pricing', require('./routes/adminPricingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));
app.use('/api/auth', require('./routes/sellerAuthRoutes'));
app.use('/api/agent/auth', require('./routes/agentAuthRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/geocoding', require('./routes/geocodingRoutes'));
app.use('/api/push', require('./routes/pushRoutes'));

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Connexion à la base de données et démarrage du serveur
const PORT = process.env.PORT || 5000;

db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Connexion MySQL établie avec succès');
    
    db.sequelize.sync({ alter: true }).then(() => {
      console.log('✅ Modèles synchronisés');
    });

    startSubscriptionJobs();
    console.log('✅ Tâches CRON abonnements démarrées');
    startNotificationJobs();
    console.log('✅ Tâches CRON notifications démarrées');
    startOrderExpirationJobs();
    console.log('✅ Tâches CRON expiration commandes démarrées');
    
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 API GAZBF v2.0 - Serveur démarré`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
      console.log(`💾 Base de données: MySQL`);
      console.log(`🌐 Origins autorisées: ${allowedOrigins.join(', ')}`);
      console.log(`\n📡 Routes disponibles:\n`);
      console.log(`🔐 AUTH:`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/verify-otp`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/me`);
      console.log(`\n📦 PRODUITS:`);
      console.log(`   GET    /api/products/search`);
      console.log(`   POST   /api/products`);
      console.log(`   GET    /api/products/my-products`);
      console.log(`\n🛒 COMMANDES:`);
      console.log(`   POST   /api/orders`);
      console.log(`   GET    /api/orders/my-orders`);
      console.log(`   GET    /api/orders/received`);
      console.log(`\n💳 ABONNEMENTS:`);
      console.log(`   GET    /api/subscriptions/plans`);
      console.log(`   POST   /api/subscriptions`);
      console.log(`   GET    /api/subscriptions/my-subscription`);
      console.log(`\n⭐ AVIS:`);
      console.log(`   POST   /api/reviews`);
      console.log(`   GET    /api/reviews/seller/:sellerId`);
      console.log(`   GET    /api/reviews/my-reviews`);
      console.log(`\n📍 ADRESSES:`);
      console.log(`   POST   /api/addresses`);
      console.log(`   GET    /api/addresses`);
      console.log(`\n🔔 NOTIFICATIONS:`);
      console.log(`   GET    /api/notifications`);
      console.log(`   GET    /api/notifications/unread-count`);
      console.log(`   PUT    /api/notifications/:id/read`);
      console.log(`\n⏰ JOBS CRON ACTIFS:`);
      console.log(`   ✓ Abonnements (vérification quotidienne)`);
      console.log(`   ✓ Notifications (nettoyage quotidien)`);
      console.log(`   ✓ Expiration commandes (toutes les heures)`);
      console.log(`   ✓ Rappels expiration (toutes les 30 min)`);
      console.log(`${'='.repeat(60)}\n`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à MySQL:', err.message);
    process.exit(1);
  });