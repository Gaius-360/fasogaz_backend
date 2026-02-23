// ==========================================
// FICHIER: models/index.js
// Index des modèles avec associations
// ==========================================

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');


const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialiser Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

// Importer tous les modèles
const db = {
  sequelize,
  Sequelize,
  User: require('./user')(sequelize, DataTypes),
  Product: require('./product')(sequelize, DataTypes),
  Order: require('./order')(sequelize, DataTypes),
  OrderItem: require('./orderItem')(sequelize, DataTypes),
  Address: require('./address')(sequelize, DataTypes),
  Subscription: require('./subscription')(sequelize, DataTypes),
  Review: require('./review')(sequelize, DataTypes),
  Transaction: require('./transaction')(sequelize, DataTypes),
  Notification: require('./notification')(sequelize, DataTypes),
  Pricing: require('./pricing')(sequelize, DataTypes),
  SystemSettings: require('./SystemSettings')(sequelize, DataTypes),
  AccessPurchase: require('./accessPurchase')(sequelize, DataTypes),
  InvitationToken: require('./invitationToken')(sequelize, DataTypes),
  AdminWithdrawal: require('./adminWithdrawal')(sequelize, DataTypes),
  PushSubscription: require('./pushSubscription')(sequelize, DataTypes)
};

// Configurer les associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;