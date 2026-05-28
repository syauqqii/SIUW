const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'siuw.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT,
    phone     TEXT,
    house_no  TEXT,
    password_hash TEXT NOT NULL,
    role      TEXT NOT NULL CHECK(role IN ('admin', 'warga')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;
