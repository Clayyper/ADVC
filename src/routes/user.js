const express = require("express");
const router = express.Router();

const { db } = require("../db");
const { requireUser } = require("../middleware");

router.use(requireUser);

router.get("/settings", (req, res) => {
  const userId = req.session.user.id;

  const settings = db.prepare(`
    SELECT
      selected_repo_full_name AS selectedRepoFullName,
      selected_repo_url AS selectedRepoUrl,
      index_location_type AS indexLocationType,
      index_repo_full_name AS indexRepoFullName,
      index_path AS indexPath,
      last_indexed_at AS lastIndexedAt,
      ai_site AS aiSite,
      ai_enabled AS aiEnabled,
      updated_at AS updatedAt
    FROM user_settings
    WHERE user_id = ?
  `).get(userId);

  const github = db.prepare(`
    SELECT
      github_login AS githubLogin,
      github_name AS githubName,
      github_avatar_url AS githubAvatarUrl,
      connected_at AS connectedAt
    FROM github_connections
    WHERE user_id = ?
  `).get(userId);

  res.json({
    settings: settings || {},
    github: github || null
  });
});

router.post("/settings/index", (req, res) => {
  const userId = req.session.user.id;
  const { indexPath, indexRepoFullName } = req.body;

  if (!indexPath) {
    return res.status(400).json({ error: "Diretório/caminho do índice é obrigatório." });
  }

  db.prepare(`
    UPDATE user_settings
    SET index_path = ?, index_repo_full_name = ?, updated_at = ?
    WHERE user_id = ?
  `).run(indexPath, indexRepoFullName || null, new Date().toISOString(), userId);

  res.json({ ok: true });
});

router.post("/settings/repository", (req, res) => {
  const userId = req.session.user.id;
  const { repoFullName, repoUrl } = req.body;

  if (!repoFullName) {
    return res.status(400).json({ error: "Repositório obrigatório." });
  }

  db.prepare(`
    UPDATE user_settings
    SET selected_repo_full_name = ?, selected_repo_url = ?, updated_at = ?
    WHERE user_id = ?
  `).run(repoFullName, repoUrl || null, new Date().toISOString(), userId);

  res.json({ ok: true });
});

router.post("/index/rebuild", (req, res) => {
  const userId = req.session.user.id;

  const settings = db.prepare(`
    SELECT selected_repo_full_name, index_path
    FROM user_settings
    WHERE user_id = ?
  `).get(userId);

  if (!settings || !settings.selected_repo_full_name) {
    return res.status(400).json({ error: "Conecte/selecione um repositório antes de atualizar o índice." });
  }

  if (!settings.index_path) {
    return res.status(400).json({ error: "Configure o caminho do índice antes de atualizar." });
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE user_settings
    SET last_indexed_at = ?, updated_at = ?
    WHERE user_id = ?
  `).run(now, now, userId);

  res.json({
    ok: true,
    message: "Índice atualizado de forma simulada no MVP.",
    lastIndexedAt: now
  });
});

router.get("/search", (req, res) => {
  const userId = req.session.user.id;
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({ error: "Informe o termo de busca." });
  }

  const settings = db.prepare(`
    SELECT selected_repo_full_name, index_path
    FROM user_settings
    WHERE user_id = ?
  `).get(userId);

  if (!settings || !settings.selected_repo_full_name || !settings.index_path) {
    return res.status(400).json({ error: "Configure repositório e índice antes de pesquisar." });
  }

  res.json({
    ok: true,
    query: q,
    results: [
      {
        title: `Resultado simulado: ${q}`,
        path: `https://github.com/${settings.selected_repo_full_name}/blob/main/${encodeURIComponent(q)}.md`,
        snippet: "Trecho simulado encontrado no índice AVDC."
      },
      {
        title: `Resumo relacionado a ${q}`,
        path: `https://github.com/${settings.selected_repo_full_name}/blob/main/resumos/${encodeURIComponent(q)}.md`,
        snippet: "No futuro este resultado virá do SQLite FTS5, ripgrep ou plugin de busca."
      }
    ]
  });
});

module.exports = router;
