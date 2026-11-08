const Hospital = require('../models/Hospital');
const EmergencyService = require('../models/EmergencyService');

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
      maxDistance = 30, // 30km radius for emergency
      bloodBankOnly,
      cardiacOnly,
      traumaOnly,
    } = req.query;

    const filter = {
      isVerified: true,
      hasEmergency: true,
    };

    let lng = parseFloat(longitude);
    let lat = parseFloat(latitude);

    // If coordinates provided, apply $near 2dsphere query
    if (!isNaN(lng) && !isNaN(lat)) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: parseFloat(maxDistance) * 1000,
        },
      };
    }

    let hospitals = await Hospital.find(filter)
      .limit(30)
      .populate('emergencyDetails')
      .populate('bedInventory')
      .lean();

    // Secondary emergency filters
    if (bloodBankOnly === 'true') {
      hospitals = hospitals.filter((h) => h.emergencyDetails && h.emergencyDetails.bloodBankAvailable);
    }
    if (cardiacOnly === 'true') {
      hospitals = hospitals.filter((h) => h.emergencyDetails && h.emergencyDetails.cardiacEmergencyReady);
    }
    if (traumaOnly === 'true') {
      hospitals = hospitals.filter((h) => h.emergencyDetails && h.emergencyDetails.traumaLevel.includes('Level 1'));
    }

    // Attach distance if coordinates provided
    if (!isNaN(lng) && !isNaN(lat)) {
      hospitals = hospitals.map((hosp) => {
        const [hospLng, hospLat] = hosp.location.coordinates;
        const distance = calculateDistanceKm(lat, lng, hospLat, hospLng);
        return {
          ...hosp,
          distance,
        };
      });
    }

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

