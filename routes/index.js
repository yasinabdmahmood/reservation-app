const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('index', { title: 'Home' }));

router.use('/students', require('./studentRoutes'));

module.exports = router;
