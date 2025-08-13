// config/schema-runner.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to database file
const dbPath = path.join(__dirname, '../db/app.db');
// Path to schema file
const schemaPath = path.join(__dirname, '../db/scchema.sql');

// Read schema SQL
const schema = fs.readFileSync(schemaPath, 'utf8');

// Create or open the database
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Running database schema...');
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error running schema:', err.message);
    } else {
      console.log('Database schema created successfully!');
    }
  });
});

db.close();
