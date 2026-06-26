const express = require("express");
const router = express.Router();
const { db } = require("../db");

router.post("/admin/login", (req, res) => {
  const { adminUser, adminPassword } = req.body;

  const admin = db.prepare("SELECT * FROM admin_config WHERE id = 1").get();

  if (!admin || admin.admin_user !== adminUser || admin.admin_password !== adminPassword) {
    return res.status(401).json({ error: "Administrador ou senha inválidos." });
  }

  req.session.user = {
    role: "admin",
    code: "admin",
    name: "Administrador"
  };

  res.json({ ok: true, role: "admin" });
});

router.post("/user/login", (req, res) => {
  const { userCode, userToken } = req.body;

  const user = db.prepare(`
    SELECT id, name, user_code, user_token, role
    FROM users
    WHERE user_code = ? AND user_token = ? AND role = 'user'
  `).get(userCode, userToken);

  if (!user) {
    return res.status(401).json({ error: "Código ou token inválido." });
  }

  req.session.user = {
    id: user.id,
    role: "user",
    code: user.user_code,
    name: user.name
  };

  res.json({
    ok: true,
    role: "user",
    user: {
      id: user.id,
      name: user.name,
      userCode: user.user_code
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
    authenticated: !!req.session.user,
    user: req.session.user || null
  });
});

module.exports = router;
