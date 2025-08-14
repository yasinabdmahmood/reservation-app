// models/studentReservationModel.js
const db = require('../config/db');

exports.findByStudentAndReservation = ({ student_id, reservation_id }) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM student_reservation WHERE student_id = ? AND reservation_id = ?`,
      [student_id, reservation_id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
};

exports.create = ({ student_id, reservation_id }) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO student_reservation (student_id, reservation_id) VALUES (?, ?)`;
    db.run(sql, [student_id, reservation_id], function (err) {
      if (err) return reject(err); // will error if over capacity or duplicate
      resolve({ id: this.lastID, student_id, reservation_id });
    });
  });
};

exports.listStudentsByReservation = (reservation_id) => new Promise((resolve, reject) => {
  db.all(
    `SELECT s.id, s.name, s.phone_number, s.id_number
     FROM student s
     JOIN student_reservation sr ON sr.student_id = s.id
     WHERE sr.reservation_id = ?
     ORDER BY s.name ASC`,
    [reservation_id],
    (err, rows) => err ? reject(err) : resolve(rows || [])
  );
});
