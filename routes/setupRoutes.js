// routes/setupRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models');

router.post('/create-admin', async (req, res) => {
  const secret = req.headers['x-setup-secret'];
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Interdit' });
  }

  try {
    const existing = await db.User.findOne({ where: { role: 'admin' } });
    if (existing) {
      return res.json({ message: 'Admin existe déjà', email: existing.email });
    }

    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const admin = await db.User.create({
      phone:      process.env.ADMIN_PHONE,
      password:   hash,
      firstName:  process.env.ADMIN_FIRST_NAME,
      lastName:   process.env.ADMIN_LAST_NAME,
      email:      process.env.ADMIN_EMAIL,
      role:       'admin',
      isVerified: true,
      isActive:   true
    }, { hooks: false });

    return res.json({ success: true, id: admin.id, email: admin.email });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;