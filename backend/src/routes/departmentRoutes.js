const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getHospitalDepartments,
  createDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDepartments);
router.post('/', protect, authorize('platform_admin'), createDepartment);
router.get('/hospital/:id', getHospitalDepartments);

module.exports = router;

