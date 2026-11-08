const Hospital = require('../models/Hospital');
const BedInventory = require('../models/BedInventory');
const EmergencyService = require('../models/EmergencyService');
const { recordAuditLog } = require('../middleware/audit');

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
      city,
      locality,
      pincode,
      speciality,
      emergency,
      is24x7,
      isVerified,
      search,
      page = 1,
      limit = 12,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Standard public listing displays verified hospitals, but allows viewing all if requested
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    } else {
      // By default show verified or pending if authenticated admin
      query.isVerified = true;
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    if (locality) {
      query.locality = { $regex: new RegExp(locality, 'i') };
    }

    if (pincode) {
      query.pincode = pincode.trim();
    }

    if (speciality && speciality !== 'All') {
      query.specialities = { $in: [new RegExp(speciality, 'i')] };
    }

    if (emergency === 'true') {
      query.hasEmergency = true;
    }

    if (is24x7 === 'true') {
      query.is24x7 = true;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { pincode: searchRegex },
        { specialities: { $in: [searchRegex] } },
        { address: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    if (sortBy === 'rating') sort.rating = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'name') sort.name = sortOrder === 'asc' ? 1 : -1;
    else sort.createdAt = -1;

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
      maxDistance = 25, // in kilometers
      emergency,
      type,
      speciality,
      limit = 20,
    } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both longitude and latitude coordinates.',
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude coordinate values.',
      });
    }

    const distanceInMeters = parseFloat(maxDistance) * 1000;
    const limitNum = parseInt(limit, 10) || 20;

    // MongoDB 2dsphere $near query with coordinates [longitude, latitude]
    const filter = {
      isVerified: true,
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

    if (type && type !== 'All') {
      filter.type = type;
    }

    if (speciality && speciality !== 'All') {
      filter.specialities = { $in: [new RegExp(speciality, 'i')] };
    }

    const hospitals = await Hospital.find(filter)
      .limit(limitNum)
      .populate('bedInventory')
      .populate('emergencyDetails')
      .lean();

    // Attach exact calculated distance (km) to each hospital
    const hospitalsWithDistance = hospitals.map((hosp) => {
      const [hospLng, hospLat] = hosp.location.coordinates;
      const distance = calculateDistanceKm(lat, lng, hospLat, hospLng);
      return {
        ...hosp,
        distance,
      };
    });

    res.json({
      success: true,
      count: hospitalsWithDistance.length,
      searchCenter: { longitude: lng, latitude: lat },
      maxDistanceKm: parseFloat(maxDistance),
      hospitals: hospitalsWithDistance,
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

    if (!q || !q.trim()) {
      return res.json({ success: true, count: 0, hospitals: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const hospitals = await Hospital.find({
      isVerified: true,
      $or: [
        { name: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { pincode: searchRegex },
        { specialities: { $in: [searchRegex] } },
      ],
    })
      .select('name slug city state address specialities type rating images hasEmergency location')
      .limit(parseInt(limit, 10) || 8)
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

    let hospital = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      hospital = await Hospital.findById(id)
        .populate('bedInventory')
        .populate('emergencyDetails')
        .populate('adminId', 'name email phone');
    } else {
      hospital = await Hospital.findOne({ slug: id.toLowerCase() })
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

    const hospitals = await Hospital.find({ _id: { $in: hospitalIds } })
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
      totalBeds = 100,
      occupiedBeds = 60,
      availableBeds = 40,
    } = req.body;

    if (!name || !address || !city || !state || !pincode || longitude === undefined || latitude === undefined || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including address, city, pincode, phone, and coordinates.',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const isPlatformAdmin = req.user.role === 'platform_admin';

    const hospital = await Hospital.create({
      name,
      slug,
      type: type || 'Private',
      description: description || '',
      address,
      locality: locality || '',
      city,
      state,
      pincode,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lng, lat]
      },
      phone,
      emergencyPhone: emergencyPhone || phone,
      email: email || req.user.email,
      website: website || '',
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80'],
      operatingHours: operatingHours || 'Open 24/7',
      is24x7: is24x7 !== undefined ? is24x7 : true,
      hasEmergency: hasEmergency !== undefined ? hasEmergency : true,
      facilities: facilities || ['Emergency Room', 'Ambulance', 'Pharmacy', 'ICU', 'Diagnostic Imaging'],
      specialities: specialities || ['General Medicine', 'Cardiology'],
      isVerified: isPlatformAdmin, // auto-verify if created directly by platform admin
      verificationStatus: isPlatformAdmin ? 'approved' : 'pending',
      adminId: req.user._id,
    });

    // Create associated BedInventory
    await BedInventory.create({
      hospitalId: hospital._id,
      totalBeds: parseInt(totalBeds, 10) || 100,
      occupiedBeds: parseInt(occupiedBeds, 10) || 60,
      availableBeds: parseInt(availableBeds, 10) || 40,
      icuBeds: { total: 20, available: 6 },
      oxygenBeds: { total: 40, available: 15 },
      ventilatorBeds: { total: 10, available: 3 },
      updatedBy: req.user._id,
    });

    // Create associated EmergencyService
    await EmergencyService.create({
      hospitalId: hospital._id,
      ambulanceNumber: emergencyPhone || phone,
      directEmergencyHotline: emergencyPhone || phone,
      traumaLevel: 'Level 2 Major Trauma',
      bloodBankAvailable: true,
      cardiacEmergencyReady: true,
      strokeCenterReady: true,
    });

    // Link hospital to user
    req.user.managedHospital = hospital._id;
    await req.user.save();

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
      message: isPlatformAdmin
        ? 'Hospital registered and verified successfully.'
        : 'Hospital registered successfully. Awaiting platform administrator verification.',
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

