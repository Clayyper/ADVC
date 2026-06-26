const express = require("express");
const router = express.Router();

const { db } = require("../db");

router.post("/admin/login", (req, res) => {
  const { adminUser, adminPassword } = req.body;

  const admin = db.prepare(`
    SELECT admin_user, admin_password
    FROM admin_config
    WHERE id = 1
  `).get();

  if (!admin || admin.admin_user !== adminUser || admin.admin_password !== adminPassword) {
    return res.status(401).json({
      error: "Administrador ou senha inválidos."
    });
  }

  req.session.admin = {
    user: admin.admin_user,
    role: "admin"
  };

  res.json({
    ok: true,
    admin: {
      user: admin.admin_user,
      role: "admin"
    }
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  res.json({
    authenticated: !!req.session.admin,
    admin: req.session.admin || null
  });
});

module.exports = router;
