const db = require('../config/db');

exports.create = ({ name, phone_number, id_number }) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO student (name, phone_number, id_number) VALUES (?, ?, ?)`;
    db.run(sql, [name, phone_number, id_number], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, name, phone_number, id_number });
    });
  });
};


exports.create = ({ name, phone_number, id_number }) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO student (name, phone_number, id_number) VALUES (?, ?, ?)`;
    db.run(sql, [name, phone_number, id_number], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, name, phone_number, id_number });
    });
  });
};

exports.findByIdNumber = (id_number) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM student WHERE id_number = ?`, [id_number], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};
