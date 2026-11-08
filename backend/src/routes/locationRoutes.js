const express = require('express');
const rateLimit = require('express-rate-limit');
const { reverseGeocode, searchPlaces } = require('../controllers/locationController');

const router = express.Router();
const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many location requests. Please wait before trying again.',
  },
});

router.use(locationLimiter);
router.get('/reverse', reverseGeocode);
router.get('/search', searchPlaces);

module.exports = router;
