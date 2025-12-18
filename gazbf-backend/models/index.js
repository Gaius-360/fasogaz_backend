// ==========================================
// FICHIER: models/index.js (COMPLET)
// ==========================================
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

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

const db = {};

// Importer tous les modèles
db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Address = require('./address')(sequelize, Sequelize.DataTypes);
db.Product = require('./product')(sequelize, Sequelize.DataTypes);
db.Order = require('./order')(sequelize, Sequelize.DataTypes);
db.OrderItem = require('./orderItem')(sequelize, Sequelize.DataTypes);
db.Subscription = require('./subscription')(sequelize, Sequelize.DataTypes);
db.Transaction = require('./transaction')(sequelize, Sequelize.DataTypes);
db.Review = require('./review')(sequelize, Sequelize.DataTypes);
db.Promotion = require('./promotion')(sequelize, Sequelize.DataTypes);
db.Favorite = require('./favorite')(sequelize, Sequelize.DataTypes);

// Établir toutes les associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;