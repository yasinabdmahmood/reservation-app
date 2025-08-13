const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '../db/app.db');
const db = new sqlite3.Database(dbPath);

// Enforce FKs per-connection
db.exec('PRAGMA foreign_keys = ON;');

module.exports = db;



