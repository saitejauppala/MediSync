const nominatimService = require('../services/nominatimService');

const getCoordinates = (latitude, longitude) => {
  if (
    typeof latitude !== 'string' || latitude.trim() === ''
    || typeof longitude !== 'string' || longitude.trim() === ''
  ) {
    return null;
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (
    latitude === undefined || longitude === undefined
    || !Number.isFinite(lat) || !Number.isFinite(lng)
    || lat < -90 || lat > 90 || lng < -180 || lng > 180
  ) {
    return null;
  }
  return { latitude: lat, longitude: lng };
};

const reverseGeocode = async (req, res, next) => {
  const coordinates = getCoordinates(req.query.latitude, req.query.longitude);
  if (!coordinates) {
    return res.status(400).json({
      success: false,
      message: 'Provide valid latitude and longitude coordinates.',
    });
  }

  try {
    const place = await nominatimService.reverseGeocode(
      coordinates.latitude,
      coordinates.longitude
    );
    return res.json({ success: true, place });
  } catch (error) {
    return next(error);
  }
};

const searchPlaces = async (req, res, next) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2 || query.length > 120) {
    return res.status(400).json({
      success: false,
      message: 'Location search must be between 2 and 120 characters.',
    });
  }

  try {
    const places = await nominatimService.searchPlaces(query);
    return res.json({ success: true, count: places.length, places });
  } catch (error) {
    return next(error);
  }
};

module.exports = { reverseGeocode, searchPlaces };
