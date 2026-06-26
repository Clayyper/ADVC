/**
 * Banco SQLite do AVDC
 *
 * IMPORTANTE:
 * - initDatabase cria tabelas se não existirem.
 * - Nunca apaga tabelas automaticamente.
 * - Atualizações futuras devem usar migrações preservando dados.
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "avdc.sqlite");
const db = new Database(dbPath);

function initDatabase() {
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_code TEXT NOT NULL UNIQUE,
      user_token TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      admin_user TEXT NOT NULL,
      admin_password TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS github_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      github_login TEXT,
      github_name TEXT,
      github_avatar_url TEXT,
      github_access_token TEXT,
      connected_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      selected_repo_full_name TEXT,
      selected_repo_url TEXT,
      index_location_type TEXT DEFAULT 'github',
      index_repo_full_name TEXT,
      index_path TEXT,
      last_indexed_at TEXT,
      ai_site TEXT,
      ai_token TEXT,
      ai_enabled INTEGER DEFAULT 0,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const admin = db.prepare("SELECT * FROM admin_config WHERE id = 1").get();

  if (!admin) {
    db.prepare(`
      INSERT INTO admin_config (id, admin_user, admin_password, updated_at)
      VALUES (1, ?, ?, ?)
    `).run(
      process.env.ADMIN_USER || "admin",
      process.env.ADMIN_PASSWORD || "admin123",
      new Date().toISOString()
    );
  }
}

module.exports = {
  db,
  initDatabase
};
