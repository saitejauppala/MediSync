const Hospital = require('../models/Hospital');
const EmergencyService = require('../models/EmergencyService');
const { CITY_NAME } = require('../constants');

// Helper to calculate distance in km using Haversine formula
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// @desc    Get nearby emergency hospitals
// @route   GET /api/emergency/nearby
// @access  Public
const getNearbyEmergency = async (req, res, next) => {
  try {
    const {
      longitude,
      latitude,
      maxDistance = 25,
      bloodBankOnly,
      cardiacOnly,
      traumaOnly,
    } = req.query;

    const filter = {
      hasEmergency: true,
      city: new RegExp(`^${CITY_NAME}$`, 'i'),
    };

    if ((longitude === undefined) !== (latitude === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Provide both longitude and latitude coordinates.',
      });
    }

    const hasCoordinates = longitude !== undefined && latitude !== undefined;
    if (hasCoordinates && (
      typeof longitude !== 'string' || longitude.trim() === ''
      || typeof latitude !== 'string' || latitude.trim() === ''
    )) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude coordinate values.',
      });
    }
    const lng = hasCoordinates ? Number(longitude) : NaN;
    const lat = hasCoordinates ? Number(latitude) : NaN;
    if (hasCoordinates && (
      !Number.isFinite(lng) || !Number.isFinite(lat)
      || lng < -180 || lng > 180 || lat < -90 || lat > 90
    )) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude coordinate values.',
      });
    }

    // If coordinates provided, apply $near 2dsphere query
    if (hasCoordinates) {
      const radiusKm = Number(maxDistance);
      if (![1, 5, 10, 25, 50].includes(radiusKm)) {
        return res.status(400).json({
          success: false,
          message: 'maxDistance must be one of 1, 5, 10, 25, or 50 kilometers.',
        });
      }
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusKm * 1000,
        },
      };
    }

    const [verifiedHospitals, communityHospitals] = await Promise.all([
      Hospital.find({ ...filter, isVerified: true })
        .limit(30)
        .populate('emergencyDetails')
        .populate('bedInventory')
        .lean(),
      Hospital.find({ ...filter, dataSource: 'openstreetmap', isVerified: false })
        .limit(30)
        .populate('emergencyDetails')
        .populate('bedInventory')
        .lean(),
    ]);
    let hospitals = [...verifiedHospitals, ...communityHospitals];

    // Secondary emergency filters
    if (bloodBankOnly === 'true') {
      hospitals = hospitals.filter((h) => h.emergencyDetails && h.emergencyDetails.bloodBankAvailable);
    }
    if (cardiacOnly === 'true') {
      hospitals = hospitals.filter((h) => h.emergencyDetails && h.emergencyDetails.cardiacEmergencyReady);
    }
    if (traumaOnly === 'true') {
      hospitals = hospitals.filter((h) => h.emergencyDetails?.traumaLevel?.includes('Level 1'));
    }

    // Attach distance if coordinates provided
    if (hasCoordinates) {
      hospitals = hospitals.map((hosp) => {
        const [hospLng, hospLat] = hosp.location.coordinates;
        const distance = calculateDistanceKm(lat, lng, hospLat, hospLng);
        return {
          ...hosp,
          distance,
        };
      });
      hospitals.sort((a, b) => a.distance - b.distance);
    }

    hospitals = hospitals.slice(0, 30);

    res.json({
      success: true,
      count: hospitals.length,
      disclaimer: 'MediSync is an informational discovery platform, not an emergency response dispatch service. If you are experiencing a life-threatening medical emergency, call 112 / 108 / 911 immediately.',
      nationalEmergencyNumbers: [
        { label: 'National Emergency', number: '112' },
        { label: 'Ambulance (India)', number: '108' },
        { label: 'Emergency (US/CA)', number: '911' },
      ],
      hospitals,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyEmergency,
};
