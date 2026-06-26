/**
 * AVDC v2.0 MVP
 * Backend Node.js + Express + SQLite
 *
 * Princípios:
 * - Código do sistema não apaga dados do usuário.
 * - Banco SQLite fica separado do frontend.
 * - Admin cria identidade.
 * - Usuário conecta seus próprios dados.
 * - IA fica apenas preparada para versão futura.
 */

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const { initDatabase } = require("./src/db");
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");
const userRoutes = require("./src/routes/user");
const githubRoutes = require("./src/routes/github");

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
app.use("/api/user", userRoutes);
app.use("/auth/github", githubRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true, app: "AVDC", version: "2.0.0" });
});

app.listen(PORT, () => {
  console.log(`AVDC rodando na porta ${PORT}`);
});
