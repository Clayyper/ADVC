/**
 * AVDC v2.4
 * Núcleo administrativo sem GitHub.
 *
 * Objetivo desta etapa:
 * - Criar banco persistente do AVDC.
 * - Criar login de administrador.
 * - Permitir troca da senha do admin.
 * - Cadastrar usuários com nome, código único e token.
 * - Listar, excluir e regenerar token de usuários.
 *
 * GitHub, repositório, índice e IA ficam para etapas futuras.
 */

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const { initDatabase } = require("./src/db");
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

initDatabase();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "avdc-dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "AVDC",
    version: "2.4.0",
    module: "admin-db"
  });
});

app.listen(PORT, () => {
  console.log(`AVDC Admin DB v2.4 rodando na porta ${PORT}`);
});
