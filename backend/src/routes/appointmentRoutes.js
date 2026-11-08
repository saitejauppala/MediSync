const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getHospitalAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createAppointment);
router.get('/my', protect, getMyAppointments);
router.get('/hospital/:id', protect, authorize('hospital_admin', 'platform_admin'), getHospitalAppointments);
router.patch('/:id/status', protect, authorize('hospital_admin', 'platform_admin'), updateAppointmentStatus);
router.delete('/:id', protect, cancelAppointment);

module.exports = router;

