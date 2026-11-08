const express = require('express');
const router = express.Router();
const { updateHospitalBeds, getHospitalBeds } = require('../controllers/bedController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:id', getHospitalBeds);
router.patch('/:id', protect, authorize('hospital_admin', 'platform_admin'), updateHospitalBeds);

module.exports = router;

