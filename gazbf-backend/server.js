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
const { startOrderExpirationJobs } = require('./jobs/orderExpirationJob'); // ✅ NOUVEAU

dotenv.config();

const app = express();

// Middleware
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,   
    'http://localhost:5173',     // Dev local
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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
app.use('/api/admin/agents', require('./routes/agentManagementRoutes'));
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

    db.sequelize.sync({ alter: false }).then(() => {
      console.log('✅ Modèles synchronisés');
    });

    // ✅ CRON jobs actifs dans TOUS les environnements
    startSubscriptionJobs();
    console.log('✅ Tâches CRON abonnements démarrées');

    startNotificationJobs();
    console.log('✅ Tâches CRON notifications démarrées');

    startOrderExpirationJobs();
    console.log('✅ Tâches CRON expiration commandes démarrées');

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à MySQL:', err.message);
    process.exit(1);
  });