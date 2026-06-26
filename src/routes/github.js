const express = require("express");
const router = express.Router();

const { db } = require("../db");
const { requireUser } = require("../middleware");

/**
 * GitHub OAuth
 *
 * Para funcionar:
 * 1. Criar OAuth App no GitHub.
 * 2. Configurar callback URL:
 *    http://localhost:3000/auth/github/callback
 *    ou URL do Render:
 *    https://seu-app.onrender.com/auth/github/callback
 * 3. Preencher .env:
 *    GITHUB_CLIENT_ID
 *    GITHUB_CLIENT_SECRET
 *    GITHUB_CALLBACK_URL
 */

router.get("/connect", requireUser, (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (!clientId || !callbackUrl) {
    return res.status(500).send("GitHub OAuth não configurado no .env.");
  }

  const state = Math.random().toString(36).slice(2);
  req.session.githubOAuthState = state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: "read:user repo",
    state
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

router.get("/callback", requireUser, async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || state !== req.session.githubOAuthState) {
    return res.status(400).send("Retorno OAuth inválido.");
  }

  delete req.session.githubOAuthState;

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).send("Não foi possível obter token do GitHub.");
    }

    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "User-Agent": "AVDC"
      }
    });

    const profile = await profileResponse.json();

    const userId = req.session.user.id;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO github_connections (
        user_id,
        github_login,
        github_name,
        github_avatar_url,
        github_access_token,
        connected_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        github_login = excluded.github_login,
        github_name = excluded.github_name,
        github_avatar_url = excluded.github_avatar_url,
        github_access_token = excluded.github_access_token,
        connected_at = excluded.connected_at
    `).run(
      userId,
      profile.login || "",
      profile.name || "",
      profile.avatar_url || "",
      tokenData.access_token,
      now
    );

    res.redirect("/?github=connected");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao conectar com GitHub.");
  }
});

router.get("/repos", requireUser, async (req, res) => {
  const userId = req.session.user.id;

  const connection = db.prepare(`
    SELECT github_access_token
    FROM github_connections
    WHERE user_id = ?
  `).get(userId);

  if (!connection || !connection.github_access_token) {
    return res.status(400).json({ error: "GitHub não conectado." });
  }

  try {
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        "Authorization": `Bearer ${connection.github_access_token}`,
        "User-Agent": "AVDC"
      }
    });

    const repos = await response.json();

    res.json({
      repos: repos.map(repo => ({
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        htmlUrl: repo.html_url,
        private: repo.private,
        defaultBranch: repo.default_branch
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar repositórios." });
  }
});

module.exports = router;
