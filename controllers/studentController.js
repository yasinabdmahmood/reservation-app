const collegeModel = require('../models/collegeModel');
const centerModel = require('../models/centerModel');
const studentModel = require('../models/studentModel');
const reservationModel = require('../models/reservationModel');
const studentReservationModel = require('../models/studentReservationModel');

exports.renderNewForm = async (req, res) => {
  try {
    const [colleges, centers] = await Promise.all([
      collegeModel.getAll(),
      centerModel.getAll()
    ]);
    return res.render('students/new', { colleges, centers, flash: null });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error loading form');
  }
};

exports.renderNewForm = async (req, res) => {
  try {
    const [colleges, centers] = await Promise.all([
      collegeModel.getAll(),
      centerModel.getAll()
    ]);
    return res.render('students/new', { colleges, centers, flash: null });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error loading form');
  }
};

exports.createStudent = async (req, res) => {
  const { name, phone_number, id_number, date, college_id, center_id } = req.body;

  const renderResult = (messageType, message, student, reservation, college, center) => {
    const available = reservation.capacity - reservation.reserved;
    return res.render('students/result', {
      messageType,
      message,
      student,
      reservation: {
        id: reservation.id,
        date: reservation.date,
        college_id: reservation.college_id,
        center_id: reservation.center_id,
        college_name: college?.name || '',
        center_name: center?.name || '',
        capacity: reservation.capacity,
        reserved: reservation.reserved,
        available
      }
    });
  };

  try {
    if (!name || !phone_number || !id_number || !date || !college_id || !center_id) {
      throw new Error('All fields are required (name, phone, ID, date, college, center).');
    }

    // Ensure reservation exists
    const reservation = await reservationModel.getOrCreate({
      date,
      college_id: Number(college_id),
      center_id: Number(center_id)
    });

    // Find or create student
    let student = await studentModel.findByIdNumber(id_number);
    if (!student) {
      student = await studentModel.create({ name, phone_number, id_number });
    }

    // Names for result page
    const [college, center] = await Promise.all([
      collegeModel.getById(reservation.college_id),
      centerModel.getById(reservation.center_id)
    ]);

    // If already linked, show "already exists"
    const existingSR = await studentReservationModel.findByStudentAndReservation({
      student_id: student.id,
      reservation_id: reservation.id
    });
    if (existingSR) {
      return renderResult(
        'warning',
        'Reservation already exists for this student.',
        student,
        reservation,
        college,
        center
      );
    }

    // Create the link (DB triggers enforce capacity and counters)
    await studentReservationModel.create({
      student_id: student.id,
      reservation_id: reservation.id
    });

    return renderResult(
      'success',
      'Reservation created successfully for the student.',
      student,
      reservation,
      college,
      center
    );
  } catch (err) {
    console.error(err);
    // Minimal fallback view (error)
    return res.render('students/result', {
      messageType: 'danger',
      message: err.message || 'Failed to create reservation.',
      student: { name, phone_number, id_number },
      reservation: {
        id: '—',
        date: date || '—',
        college_id: Number(college_id) || null,
        center_id: Number(center_id) || null,
        college_name: '—',
        center_name: '—',
        capacity: '—',
        reserved: '—',
        available: '—'
      }
    });
  }
};

// GET /students/api/reservations/check?date=YYYY-MM-DD&college_id=..&center_id=..
exports.checkOrCreateReservation = async (req, res) => {
  try {
    const { date, college_id, center_id } = req.query;

    if (!date || !college_id || !center_id) {
      return res.status(400).json({ ok: false, error: 'Missing date, college_id, or center_id.' });
    }

    const reservation = await reservationModel.getOrCreate({
      date,
      college_id: Number(college_id),
      center_id: Number(center_id)
    });

    // Fetch names to include in the response
    const [college, center] = await Promise.all([
      collegeModel.getById(reservation.college_id),
      centerModel.getById(reservation.center_id)
    ]);

    const available = reservation.capacity - reservation.reserved;

    return res.json({
      ok: true,
      reservation: {
        id: reservation.id,
        date: reservation.date,
        college_id: reservation.college_id,
        center_id: reservation.center_id,
        college_name: college?.name || '',
        center_name: center?.name || '',
        capacity: reservation.capacity,
        reserved: reservation.reserved,
        available
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to check/create reservation.' });
  }
};

