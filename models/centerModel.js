const db = require('../config/db');

exports.getAll = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, name FROM center ORDER BY name`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// add this:
exports.getById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name FROM center WHERE id = ?`, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};
