const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin page (selector + results)
router.get('/reservations', adminController.renderReservationAdmin);

// AJAX: find reservation by date + center (no auto-create)
router.get('/api/reservation', adminController.apiFindReservation);

// Download Excel of students for a reservation
router.get('/reservations/:reservationId/download', adminController.downloadStudentsXlsx);

module.exports = router;
