// config/seed.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the SQLite database
const dbPath = path.join(__dirname, '../db/app.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('🌱 Seeding database with sample data...');

  // Insert fake colleges
  const colleges = [
    'College of Engineering',
    'College of Science',
    'College of Arts',
    'College of Business',
    'College of Medicine'
  ];
  colleges.forEach(name => {
    db.run('INSERT INTO college (name) VALUES (?)', [name], function (err) {
      if (err) {
        console.error('❌ Error inserting college:', err.message);
      } else {
        console.log(`✅ College added: ${name}`);
      }
    });
  });

  // Insert fake centers
  const centers = [
    'Downtown Exam Center',
    'North Campus Center',
    'South Campus Center',
    'East Learning Hub',
    'West Training Center'
  ];
  centers.forEach(name => {
    db.run('INSERT INTO center (name) VALUES (?)', [name], function (err) {
      if (err) {
        console.error('❌ Error inserting center:', err.message);
      } else {
        console.log(`✅ Center added: ${name}`);
      }
    });
  });
});

db.close(() => {
  console.log('🌱 Seeding complete!');
});
