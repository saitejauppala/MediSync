const express = require('express');
const router = express.Router();
const {
  getHospitals,
  getNearbyHospitals,
  searchHospitals,
  getHospitalById,
  compareHospitals,
  createHospital,
  updateHospital,
} = require('../controllers/hospitalController');
const { getHospitalBeds } = require('../controllers/bedController');
const { getHospitalReviews, addReview } = require('../controllers/reviewController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

router.get('/', getHospitals);
router.get('/nearby', getNearbyHospitals);
router.get('/search', searchHospitals);
router.get('/compare', compareHospitals);
router.get('/:id', optionalAuth, getHospitalById);
router.post('/', protect, authorize('hospital_admin', 'platform_admin'), createHospital);
router.patch('/:id', protect, authorize('hospital_admin', 'platform_admin'), updateHospital);

// Nested routes
router.get('/:id/beds', getHospitalBeds);
router.get('/:id/reviews', getHospitalReviews);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
