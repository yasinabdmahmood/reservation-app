const path = require('path');
const ExcelJS = require('exceljs');

const centerModel = require('../models/centerModel');
const reservationModel = require('../models/reservationModel');
const studentReservationModel = require('../models/studentReservationModel');

exports.renderReservationAdmin = async (req, res) => {
  try {
    const centers = await centerModel.getAll();
    return res.render('admin/reservations', { centers });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to load admin reservation view.');
  }
};

// GET /admin/api/reservation?center_id=..&date=YYYY-MM-DD
// Only fetch existing reservation (no auto-create here)
exports.apiFindReservation = async (req, res) => {
  try {
    const { center_id, date } = req.query;
    if (!center_id || !date) {
      return res.status(400).json({ ok: false, error: 'Missing center_id or date.' });
    }

    const reservation = await reservationModel.findByUnique({
      center_id: Number(center_id),
      date
    });

    if (!reservation) {
      return res.json({ ok: false, error: 'No reservation found for this date and center.' });
    }

    const center = await centerModel.getById(reservation.center_id);
    const available = reservation.capacity - reservation.reserved;

    return res.json({
      ok: true,
      reservation: {
        id: reservation.id,
        date: reservation.date,
        center_id: reservation.center_id,
        center_name: center?.name || '',
        capacity: reservation.capacity,
        reserved: reservation.reserved,
        available
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to fetch reservation.' });
  }
};

// GET /admin/reservations/:reservationId/download
// updated downloadStudentsXlsx function
exports.downloadStudentsXlsx = async (req, res) => {
  try {
    const reservationId = Number(req.params.reservationId);
    if (!reservationId) return res.status(400).send('Invalid reservation id.');

    const reservation = await new Promise((resolve, reject) => {
      const db = require('../config/db');
      db.get(`SELECT * FROM reservation WHERE id = ?`, [reservationId], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });

    if (!reservation) {
      return res.status(404).send('Reservation not found.');
    }

    const center = await centerModel.getById(reservation.center_id);
    const students = await studentReservationModel.listStudentsByReservation(reservationId);

    // Create a new Excel workbook
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Reservation');

    // Header info
    ws.addRow(['Reservation ID', reservation.id]);
    ws.addRow(['Date', reservation.date]);
    ws.addRow(['Center', center?.name || reservation.center_id]);
    ws.addRow(['Capacity', reservation.capacity]);
    ws.addRow(['Reserved', reservation.reserved]);
    ws.addRow(['Available', reservation.capacity - reservation.reserved]);
    ws.addRow([]); // empty line

    // Table header
    ws.addRow(['#', 'Student ID', 'Name', 'ID Number', 'Phone Number']);

    // Data rows
    students.forEach((s, idx) => {
      ws.addRow([idx + 1, s.id, s.name, s.id_number, s.phone_number]);
    });

    // Sanitize filename by removing invalid characters
    const safeCenter = (center?.name || 'center')
      .replace(/[\\/:*?"<>|]/g, '-') // Replace invalid filename characters
      .replace(/[^a-z0-9_\- .]/gi, ''); // Allow only safe characters (alphanumeric, spaces, _ , - , .)

    const fname = `reservation_${reservation.date}_${safeCenter}.xlsx`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);

    // Write the file and send it as the response
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to generate Excel.');
  }
};


