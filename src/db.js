/**
 * Banco SQLite do AVDC
 *
 * Regras:
 * - Cria tabelas se não existirem.
 * - Nunca apaga dados automaticamente.
 * - Atualizações futuras devem usar migrações.
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.SQLITE_PATH || path.join(dataDir, "avdc.sqlite");
const db = new Database(dbPath);

function initDatabase() {
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      admin_user TEXT NOT NULL,
      admin_password TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_code TEXT NOT NULL UNIQUE,
      user_token TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_future_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      github_connected INTEGER DEFAULT 0,
      github_login TEXT,
      github_token_encrypted TEXT,
      selected_repo_full_name TEXT,
      index_location TEXT,
      index_path TEXT,
      ai_site TEXT,
      ai_token_encrypted TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const now = new Date().toISOString();
  const admin = db.prepare("SELECT id FROM admin_config WHERE id = 1").get();

  if (!admin) {
    db.prepare(`
      INSERT INTO admin_config (
        id,
        admin_user,
        admin_password,
        created_at,
        updated_at
      )
      VALUES (1, ?, ?, ?, ?)
    `).run(
      process.env.ADMIN_USER || "admin",
      process.env.ADMIN_PASSWORD || "admin123",
      now,
      now
    );
  }
}

module.exports = {
  db,
  initDatabase
};
