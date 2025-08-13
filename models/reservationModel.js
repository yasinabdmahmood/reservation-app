const db = require('../config/db');

// Adjust as you wish (or make it configurable)
const DEFAULT_CAPACITY = 30;

exports.findByUnique = ({ date, college_id, center_id }) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM reservation WHERE date = ? AND college_id = ? AND center_id = ?`,
      [date, college_id, center_id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
};

exports.create = ({ date, college_id, center_id, capacity = DEFAULT_CAPACITY }) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO reservation (center_id, college_id, date, capacity, reserved) VALUES (?, ?, ?, ?, 0)`;
    db.run(sql, [center_id, college_id, date, capacity], function (err) {
      if (err) return reject(err);
      db.get(`SELECT * FROM reservation WHERE id = ?`, [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

exports.getOrCreate = async ({ date, college_id, center_id }) => {
  const existing = await this.findByUnique({ date, college_id, center_id });
  if (existing) return existing;
  return await this.create({ date, college_id, center_id });
};
