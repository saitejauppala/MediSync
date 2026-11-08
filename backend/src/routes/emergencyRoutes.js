const express = require('express');
const router = express.Router();
const { getNearbyEmergency } = require('../controllers/emergencyController');

router.get('/nearby', getNearbyEmergency);

module.exports = router;

