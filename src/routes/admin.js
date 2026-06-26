const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const { db } = require("../db");
const { requireAdmin } = require("../middleware");

router.use(requireAdmin);

function generateToken() {
  return crypto.randomInt(100000, 999999).toString();
}

router.get("/users", (req, res) => {
  const users = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.user_code AS userCode,
      u.user_token AS userToken,
      u.created_at AS createdAt,
      s.selected_repo_full_name AS selectedRepo,
      s.index_path AS indexPath,
      g.github_login AS githubLogin
    FROM users u
    LEFT JOIN user_settings s ON s.user_id = u.id
    LEFT JOIN github_connections g ON g.user_id = u.id
    WHERE u.role = 'user'
    ORDER BY u.id DESC
  `).all();

  res.json({ users });
});

router.post("/users", (req, res) => {
  const { name, userCode } = req.body;

  if (!name || !userCode) {
    return res.status(400).json({ error: "Nome e código do usuário são obrigatórios." });
  }

  const exists = db.prepare("SELECT id FROM users WHERE user_code = ?").get(userCode);

  if (exists) {
    return res.status(409).json({ error: "Código do usuário já existe." });
  }

  const token = generateToken();
  const createdAt = new Date().toISOString();

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO users (name, user_code, user_token, role, created_at)
      VALUES (?, ?, ?, 'user', ?)
    `).run(name, userCode, token, createdAt);

    db.prepare(`
      INSERT INTO user_settings (user_id, updated_at)
      VALUES (?, ?)
    `).run(result.lastInsertRowid, createdAt);

    return result.lastInsertRowid;
  });

  const userId = tx();

  res.json({
    ok: true,
    user: {
      id: userId,
      name,
      userCode,
      userToken: token
    }
  });
});

router.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM github_connections WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM user_settings WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ? AND role = 'user'").run(id);
  });

  tx();

  res.json({ ok: true });
});

router.post("/change-password", (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 4 caracteres." });
  }

  db.prepare(`
    UPDATE admin_config
    SET admin_password = ?, updated_at = ?
    WHERE id = 1
  `).run(newPassword, new Date().toISOString());

  res.json({ ok: true });
});

module.exports = router;
