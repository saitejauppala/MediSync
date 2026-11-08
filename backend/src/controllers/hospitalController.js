const Hospital = require('../models/Hospital');
const BedInventory = require('../models/BedInventory');
const EmergencyService = require('../models/EmergencyService');
const { recordAuditLog } = require('../middleware/audit');
const { CITY_NAME } = require('../constants');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseBoundedInteger = (value, name, min, max, fallback) => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    const error = new Error(`${name} must be an integer between ${min} and ${max}.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const getDirectoryVisibilityFilter = () => ({
  $or: [{ isVerified: true }, { dataSource: 'openstreetmap' }],
});

// Helper to calculate distance in km using Haversine formula
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
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

// @desc    Get all hospitals with filtering & pagination
// @route   GET /api/hospitals
// @access  Public
const getHospitals = async (req, res, next) => {
  try {
    const {
      type,
      locality,
      district,
      pincode,
      speciality,
      emergency,
      is24x7,
      verifiedOnly,
      search,
      page = 1,
      limit = 12,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = req.query;

    const query = {
      city: new RegExp(`^${CITY_NAME}$`, 'i'),
      $and: [verifiedOnly === 'true'
        ? { isVerified: true }
        : getDirectoryVisibilityFilter()],
    };

    if (type && type !== 'All') {
      query.type = type;
    }

    if (locality) {
      query.locality = { $regex: new RegExp(escapeRegex(String(locality).trim()), 'i') };
    }

    if (district) {
      query.district = { $regex: new RegExp(escapeRegex(String(district).trim()), 'i') };
    }

    if (pincode) {
      query.pincode = pincode.trim();
    }

    if (speciality && speciality !== 'All') {
      query.specialities = { $in: [new RegExp(escapeRegex(String(speciality).trim()), 'i')] };
    }

    if (emergency === 'true') {
      query.hasEmergency = true;
    }

    if (is24x7 === 'true') {
      query.is24x7 = true;
    }

    if (search) {
      if (String(search).trim().length > 100) {
        return res.status(400).json({ success: false, message: 'Search must not exceed 100 characters.' });
      }
      const searchRegex = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$and.push({ $or: [
        { name: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { district: searchRegex },
        { pincode: searchRegex },
        { address: searchRegex },
        { specialities: { $in: [searchRegex] } },
      ] });
    }

    const pageNum = parseBoundedInteger(page, 'page', 1, 100000, 1);
    const limitNum = parseBoundedInteger(limit, 'limit', 1, 50, 12);
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ success: false, message: 'sortOrder must be asc or desc.' });
    }
    if (sortBy === 'rating') sort.rating = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'reviews') sort.reviewCount = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'name') sort.name = sortOrder === 'desc' ? -1 : 1;
    else if (sortBy === 'recent') sort.createdAt = -1;
    else {
      return res.status(400).json({
        success: false,
        message: 'sortBy must be rating, reviews, name, or recent.',
      });
    }

    const [hospitals, total] = await Promise.all([
      Hospital.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('bedInventory')
        .populate('emergencyDetails')
        .lean(),
      Hospital.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: hospitals.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      hospitals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby hospitals using MongoDB GeoJSON [longitude, latitude]
// @route   GET /api/hospitals/nearby
// @access  Public
const getNearbyHospitals = async (req, res, next) => {
  try {
    const {
      longitude,
      latitude,
      maxDistance = 10,
      emergency,
      is24x7,
      type,
      speciality,
      search,
      locality,
      district,
      pincode,
      verifiedOnly,
      sortBy = 'nearest',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = req.query;

    if (
      typeof longitude !== 'string' || longitude.trim() === ''
      || typeof latitude !== 'string' || latitude.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both longitude and latitude coordinates.',
      });
    }

    const lng = Number(longitude);
    const lat = Number(latitude);

    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude coordinate values.',
      });
    }

    const distanceKm = Number(maxDistance);
    if (![1, 5, 10, 25, 50].includes(distanceKm)) {
      return res.status(400).json({
        success: false,
        message: 'maxDistance must be one of 1, 5, 10, 25, or 50 kilometers.',
      });
    }

    if (search && String(search).trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Search must not exceed 100 characters.' });
    }

    if (!['nearest', 'rating', 'reviews', 'name', 'recent'].includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'sortBy must be nearest, rating, reviews, name, or recent.',
      });
    }
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ success: false, message: 'sortOrder must be asc or desc.' });
    }

    const pageNum = parseBoundedInteger(page, 'page', 1, 100000, 1);
    const limitNum = parseBoundedInteger(limit, 'limit', 1, 100, 20);
    const skip = (pageNum - 1) * limitNum;
    const distanceInMeters = distanceKm * 1000;

    // MongoDB 2dsphere $near query with coordinates [longitude, latitude]
    const filter = {
      city: new RegExp(`^${CITY_NAME}$`, 'i'),
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: distanceInMeters,
        },
      },
    };

    if (emergency === 'true') {
      filter.hasEmergency = true;
    }

    if (is24x7 === 'true') {
      filter.is24x7 = true;
    }

    if (type && type !== 'All') {
      filter.type = type;
    }

    if (speciality && speciality !== 'All') {
      filter.specialities = { $in: [new RegExp(escapeRegex(String(speciality).trim()), 'i')] };
    }
    if (locality) {
      filter.locality = new RegExp(escapeRegex(String(locality).trim()), 'i');
    }
    if (district) {
      filter.district = new RegExp(escapeRegex(String(district).trim()), 'i');
    }
    if (pincode) {
      filter.pincode = String(pincode).trim();
    }
    if (search) {
      const searchRegex = new RegExp(escapeRegex(String(search).trim()), 'i');
      filter.$and = [{ $or: [
        { name: searchRegex },
        { locality: searchRegex },
        { district: searchRegex },
        { city: searchRegex },
        { pincode: searchRegex },
        { address: searchRegex },
        { specialities: { $in: [searchRegex] } },
      ] }];
    }

    const [verifiedHospitals, communityHospitals] = await Promise.all([
      Hospital.find({ ...filter, isVerified: true })
        .limit(1000)
        .populate('bedInventory')
        .populate('emergencyDetails')
        .lean(),
      verifiedOnly === 'true'
        ? Promise.resolve([])
        : Hospital.find({ ...filter, dataSource: 'openstreetmap', isVerified: false })
          .limit(1000)
          .populate('bedInventory')
          .populate('emergencyDetails')
          .lean(),
    ]);

    // Attach exact calculated distance (km) to each hospital
    const hospitalsWithDistance = [...verifiedHospitals, ...communityHospitals].map((hosp) => {
      const [hospLng, hospLat] = hosp.location.coordinates;
      const distance = calculateDistanceKm(lat, lng, hospLat, hospLng);
      return {
        ...hosp,
        distance,
      };
    });

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    hospitalsWithDistance.sort((a, b) => {
      if (sortBy === 'rating') return (a.rating - b.rating) * sortDirection;
      if (sortBy === 'reviews') return (a.reviewCount - b.reviewCount) * sortDirection;
      if (sortBy === 'name') return a.name.localeCompare(b.name) * sortDirection;
      if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      return a.distance - b.distance;
    });
    const pagedHospitals = hospitalsWithDistance.slice(skip, skip + limitNum);

    res.json({
      success: true,
      count: pagedHospitals.length,
      total: hospitalsWithDistance.length,
      totalPages: Math.ceil(hospitalsWithDistance.length / limitNum),
      currentPage: pageNum,
      searchCenter: { longitude: lng, latitude: lat },
      maxDistanceKm: distanceKm,
      hospitals: pagedHospitals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search hospitals with live suggestions
// @route   GET /api/hospitals/search
// @access  Public
const searchHospitals = async (req, res, next) => {
  try {
    const { q, limit = 8 } = req.query;

    if (q === undefined || q === '') {
      return res.json({ success: true, count: 0, hospitals: [] });
    }
    if (typeof q !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query must be a string.' });
    }

    if (String(q).trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Search must not exceed 100 characters.' });
    }

    const searchRegex = new RegExp(escapeRegex(String(q).trim()), 'i');
    const hospitals = await Hospital.find({
      city: new RegExp(`^${CITY_NAME}$`, 'i'),
      $and: [
        getDirectoryVisibilityFilter(),
        { $or: [
        { name: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { district: searchRegex },
        { pincode: searchRegex },
        { specialities: { $in: [searchRegex] } },
        ] },
      ],
    })
      .select('name slug city state address locality district pincode specialities type rating reviewCount images hasEmergency location dataSource sourceReference')
      .limit(parseBoundedInteger(limit, 'limit', 1, 20, 8))
      .lean();

    res.json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hospital by ID or slug
// @route   GET /api/hospitals/:id
// @access  Public
const getHospitalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'platform_admin'
      || (
        req.user?.role === 'hospital_admin'
        && /^[0-9a-fA-F]{24}$/.test(id)
        && req.user.managedHospital?.toString() === id.toLowerCase()
      );
    const visibleFilter = isAdmin
      ? {}
      : {
        city: new RegExp(`^${CITY_NAME}$`, 'i'),
        $or: [{ isVerified: true }, { dataSource: 'openstreetmap' }],
      };

    let hospital = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      hospital = await Hospital.findOne({ _id: id, ...visibleFilter })
        .populate('bedInventory')
        .populate('emergencyDetails')
        .populate('adminId', 'name email phone');
    } else {
      hospital = await Hospital.findOne({ slug: id.toLowerCase(), ...visibleFilter })
        .populate('bedInventory')
        .populate('emergencyDetails')
        .populate('adminId', 'name email phone');
    }

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found.',
      });
    }

    res.json({
      success: true,
      hospital,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Compare up to 3 hospitals side-by-side
// @route   GET /api/hospitals/compare
// @access  Public
const compareHospitals = async (req, res, next) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: 'Please provide comma-separated hospital IDs to compare.',
      });
    }

    const hospitalIds = ids
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.match(/^[0-9a-fA-F]{24}$/))
      .slice(0, 3);

    if (hospitalIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid hospital IDs provided.',
      });
    }

    const hospitals = await Hospital.find({
      _id: { $in: hospitalIds },
      city: new RegExp(`^${CITY_NAME}$`, 'i'),
      $or: [{ isVerified: true }, { dataSource: 'openstreetmap' }],
    })
      .populate('bedInventory')
      .populate('emergencyDetails')
      .lean();

    res.json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new hospital (Hospital Admin or Platform Admin)
// @route   POST /api/hospitals
// @access  Private (hospital_admin, platform_admin)
const createHospital = async (req, res, next) => {
  try {
    const {
      name,
      type,
      description,
      address,
      locality,
      city,
      state,
      pincode,
      longitude,
      latitude,
      phone,
      emergencyPhone,
      email,
      website,
      images,
      operatingHours,
      is24x7,
      hasEmergency,
      facilities,
      specialities,
      totalBeds,
      occupiedBeds,
      availableBeds,
      emergencyDetails,
    } = req.body;

    if (!name || !address || !city || !state || !pincode || longitude === undefined || latitude === undefined || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including address, city, pincode, phone, and coordinates.',
      });
    }

    if (city.trim().toLowerCase() !== CITY_NAME.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: `Only hospitals located in ${CITY_NAME} can be registered.`,
      });
    }

    if (
      (is24x7 !== undefined && typeof is24x7 !== 'boolean')
      || (hasEmergency !== undefined && typeof hasEmergency !== 'boolean')
    ) {
      return res.status(400).json({
        success: false,
        message: 'is24x7 and hasEmergency must be boolean values when provided.',
      });
    }

    if (
      (facilities !== undefined && !Array.isArray(facilities))
      || (specialities !== undefined && !Array.isArray(specialities))
      || (images !== undefined && !Array.isArray(images))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Images, facilities, and specialities must be arrays when provided.',
      });
    }

    const bedValues = [totalBeds, occupiedBeds, availableBeds];
    if (bedValues.some((value) => value !== undefined)) {
      if (
        bedValues.some((value) => !Number.isInteger(value) || value < 0)
        || occupiedBeds + availableBeds > totalBeds
      ) {
        return res.status(400).json({
          success: false,
          message: 'Provide non-negative integer total, occupied, and available bed counts with a consistent total.',
        });
      }
    }

    if (
      hasEmergency === true
      && (
        !emergencyDetails
        || typeof emergencyDetails.ambulanceNumber !== 'string'
        || typeof emergencyDetails.directEmergencyHotline !== 'string'
        || !emergencyDetails.ambulanceNumber.trim()
        || !emergencyDetails.directEmergencyHotline.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Provide verified ambulance and emergency hotline numbers before listing emergency services.',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const hospital = await Hospital.create({
      name,
      slug,
      type: type || 'Unknown',
      description: description || '',
      address,
      locality: locality || '',
      city,
      state,
      pincode,
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      },
      phone,
      emergencyPhone: emergencyPhone || '',
      email: email || undefined,
      website: website || '',
      images: images || [],
      operatingHours: operatingHours || 'Hours not listed',
      is24x7: is24x7 === true,
      hasEmergency: hasEmergency === true,
      facilities: facilities || [],
      specialities: specialities || [],
      isVerified: false,
      verificationStatus: 'pending',
      adminId: req.user.role === 'hospital_admin' ? req.user._id : null,
    });

    if (totalBeds !== undefined) {
      await BedInventory.create({
        hospitalId: hospital._id,
        totalBeds,
        occupiedBeds,
        availableBeds,
        updatedBy: req.user._id,
      });
    }

    if (hasEmergency === true) {
      const {
        ambulanceNumber,
        directEmergencyHotline,
        traumaLevel,
        helipadAvailable,
        bloodBankAvailable,
        burnUnitAvailable,
        strokeCenterReady,
        cardiacEmergencyReady,
        pediatricEmergencyReady,
        operatingStatus,
      } = emergencyDetails;
      await EmergencyService.create({
        hospitalId: hospital._id,
        ambulanceNumber,
        directEmergencyHotline,
        ...(traumaLevel !== undefined && { traumaLevel }),
        ...(helipadAvailable !== undefined && { helipadAvailable }),
        ...(bloodBankAvailable !== undefined && { bloodBankAvailable }),
        ...(burnUnitAvailable !== undefined && { burnUnitAvailable }),
        ...(strokeCenterReady !== undefined && { strokeCenterReady }),
        ...(cardiacEmergencyReady !== undefined && { cardiacEmergencyReady }),
        ...(pediatricEmergencyReady !== undefined && { pediatricEmergencyReady }),
        ...(operatingStatus !== undefined && { operatingStatus }),
      });
    }

    // Link hospital to user
    if (req.user.role === 'hospital_admin') {
      req.user.managedHospital = hospital._id;
      await req.user.save();
    }

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'HOSPITAL_CREATED',
      entityType: 'Hospital',
      entityId: hospital._id,
      details: { name: hospital.name, isVerified: hospital.isVerified },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully. Awaiting platform administrator verification.',
      hospital,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital details
// @route   PATCH /api/hospitals/:id
// @access  Private (hospital_admin, platform_admin)
const updateHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospital = await Hospital.findById(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found.',
      });
    }

    // Authorization check: platform admin or assigned hospital admin
    const isOwner = req.user.role === 'hospital_admin' && (
      (hospital.adminId && hospital.adminId.toString() === req.user._id.toString()) ||
      (req.user.managedHospital && req.user.managedHospital.toString() === hospital._id.toString())
    );
    const isPlatformAdmin = req.user.role === 'platform_admin';

    if (!isOwner && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this hospital.',
      });
    }

    const {
      name,
      type,
      description,
      address,
      locality,
      city,
      state,
      pincode,
      longitude,
      latitude,
      phone,
      emergencyPhone,
      email,
      website,
      images,
      operatingHours,
      is24x7,
      hasEmergency,
      facilities,
      specialities,
    } = req.body;

    if (city && city.trim().toLowerCase() !== CITY_NAME.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: `Hospital locations must remain within ${CITY_NAME}.`,
      });
    }

    if (name) hospital.name = name;
    if (type) hospital.type = type;
    if (description !== undefined) hospital.description = description;
    if (address) hospital.address = address;
    if (locality !== undefined) hospital.locality = locality;
    if (city) hospital.city = city;
    if (state) hospital.state = state;
    if (pincode) hospital.pincode = pincode;
    if (longitude !== undefined && latitude !== undefined) {
      hospital.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }
    if (phone) hospital.phone = phone;
    if (emergencyPhone !== undefined) hospital.emergencyPhone = emergencyPhone;
    if (email !== undefined) hospital.email = email;
    if (website !== undefined) hospital.website = website;
    if (images && images.length) hospital.images = images;
    if (operatingHours !== undefined) hospital.operatingHours = operatingHours;
    if (is24x7 !== undefined) hospital.is24x7 = is24x7;
    if (hasEmergency !== undefined) hospital.hasEmergency = hasEmergency;
    if (facilities) hospital.facilities = facilities;
    if (specialities) hospital.specialities = specialities;

    await hospital.save();

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'HOSPITAL_UPDATED',
      entityType: 'Hospital',
      entityId: hospital._id,
      details: { name: hospital.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Hospital details updated successfully.',
      hospital,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHospitals,
  getNearbyHospitals,
  searchHospitals,
  getHospitalById,
  compareHospitals,
  createHospital,
  updateHospital,
};
