const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Render the form
router.get('/new', studentController.renderNewForm);

// Create student (simple create; you can extend to also reserve a seat)
router.post('/', studentController.createStudent);

// AJAX: check or create reservation by (date, center, college)
router.get('/api/reservations/check', studentController.checkOrCreateReservation);

module.exports = router;
