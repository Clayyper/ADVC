/**
 * AVDC v2.5
 * Núcleo administrativo com PostgreSQL.
 *
 * Objetivo:
 * - Manter usuários persistentes entre deploys/restarts.
 * - Usar DATABASE_URL do Render PostgreSQL.
 * - Admin cria usuários.
 * - Usuário valida login com código + token.
 *
 * GitHub fica para a próxima etapa.
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
    version: "2.5.0",
    module: "admin-db-postgres",
    database: process.env.DATABASE_URL ? "postgres" : "not-configured"
  });
});

async function start() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`AVDC Admin DB v2.5 rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar AVDC:", error);
    process.exit(1);
  }
}

start();
