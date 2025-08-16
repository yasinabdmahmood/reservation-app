const express = require('express');
const router = express.Router();


// Redirect root to /students/new
router.get('/', (req, res) => {
  res.redirect('/students/new');
});

router.use('/students', require('./studentRoutes'));
router.use('/admin', require('./adminRoutes')); 

module.exports = router;
