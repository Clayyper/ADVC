const express = require("express");
const crypto = require("crypto");

const { db } = require("../db");
const { requireAdmin } = require("../middleware");

const router = express.Router();

router.use(requireAdmin);

function generateToken() {
  return crypto.randomInt(100000, 999999).toString();
}

function normalizeUserCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateUser(name, userCode) {
  const cleanName = String(name || "").trim();
  const cleanCode = normalizeUserCode(userCode);

  if (cleanName.length < 2) {
    return { error: "Informe um nome com pelo menos 2 caracteres." };
  }

  if (cleanCode.length < 3) {
    return { error: "O código único precisa ter pelo menos 3 caracteres." };
  }

  if (cleanCode.length > 40) {
    return { error: "O código único deve ter no máximo 40 caracteres." };
  }

  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(cleanCode)) {
    return {
      error: "Use apenas letras, números, ponto, hífen ou underline. O código deve começar e terminar com letra ou número."
    };
  }

  return {
    name: cleanName,
    userCode: cleanCode
  };
}

router.get("/dashboard", (req, res) => {
  const totalUsers = db.prepare(`
    SELECT COUNT(*) AS total
    FROM users
  `).get();

  const activeUsers = db.prepare(`
    SELECT COUNT(*) AS total
    FROM users
    WHERE status = 'active'
  `).get();

  res.json({
    totalUsers: totalUsers.total,
    activeUsers: activeUsers.total
  });
});

router.get("/users", (req, res) => {
  const users = db.prepare(`
    SELECT
      id,
      name,
      user_code AS userCode,
      user_token AS userToken,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM users
    ORDER BY id DESC
  `).all();

  res.json({ users });
});

router.post("/users", (req, res) => {
  const checked = validateUser(req.body.name, req.body.userCode);

  if (checked.error) {
    return res.status(400).json({ error: checked.error });
  }

  const exists = db.prepare(`
    SELECT id
    FROM users
    WHERE user_code = ?
  `).get(checked.userCode);

  if (exists) {
    return res.status(409).json({
      error: "Código do usuário já existe. Escolha outro código."
    });
  }

  const now = new Date().toISOString();
  const token = generateToken();

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO users (
        name,
        user_code,
        user_token,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, 'active', ?, ?)
    `).run(
      checked.name,
      checked.userCode,
      token,
      now,
      now
    );

    db.prepare(`
      INSERT INTO user_future_config (
        user_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?)
    `).run(result.lastInsertRowid, now, now);

    return result.lastInsertRowid;
  });

  const userId = tx();

  res.json({
    ok: true,
    user: {
      id: userId,
      name: checked.name,
      userCode: checked.userCode,
      userToken: token,
      status: "active"
    }
  });
});

router.post("/users/:id/regenerate-token", (req, res) => {
  const id = Number(req.params.id);

  const user = db.prepare(`
    SELECT id
    FROM users
    WHERE id = ?
  `).get(id);

  if (!user) {
    return res.status(404).json({
      error: "Usuário não encontrado."
    });
  }

  const token = generateToken();

  db.prepare(`
    UPDATE users
    SET user_token = ?, updated_at = ?
    WHERE id = ?
  `).run(token, new Date().toISOString(), id);

  res.json({
    ok: true,
    userToken: token
  });
});

router.post("/users/:id/status", (req, res) => {
  const id = Number(req.params.id);
  const status = req.body.status === "inactive" ? "inactive" : "active";

  const result = db.prepare(`
    UPDATE users
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, new Date().toISOString(), id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Usuário não encontrado."
    });
  }

  res.json({
    ok: true,
    status
  });
});

router.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM user_future_config WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  });

  tx();

  res.json({ ok: true });
});

router.post("/change-password", (req, res) => {
  const newPassword = String(req.body.newPassword || "").trim();

  if (newPassword.length < 4) {
    return res.status(400).json({
      error: "A senha deve ter pelo menos 4 caracteres."
    });
  }

  db.prepare(`
    UPDATE admin_config
    SET admin_password = ?, updated_at = ?
    WHERE id = 1
  `).run(newPassword, new Date().toISOString());

  res.json({ ok: true });
});

module.exports = router;
