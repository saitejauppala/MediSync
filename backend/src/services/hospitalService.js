const Hospital = require('../models/Hospital');
const BedInventory = require('../models/BedInventory');
const EmergencyService = require('../models/EmergencyService');
const { calculateDistanceKm, createSlug } = require('../utils/geo');
const { recordAuditLog } = require('../middleware/audit');

class HospitalService {
  async getHospitals(filters, pagination, sortOptions) {
    const query = {};

    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified === 'true';
    } else {
      query.isVerified = true;
    }

    if (filters.type && filters.type !== 'All') {
      query.type = filters.type;
    }

    if (filters.city) {
      query.city = { $regex: new RegExp(filters.city, 'i') };
    }

    if (filters.locality) {
      query.locality = { $regex: new RegExp(filters.locality, 'i') };
    }

    if (filters.pincode) {
      query.pincode = filters.pincode.trim();
    }

    if (filters.speciality && filters.speciality !== 'All') {
      query.specialities = { $in: [new RegExp(filters.speciality, 'i')] };
    }

    if (filters.emergency === 'true') {
      query.hasEmergency = true;
    }

    if (filters.is24x7 === 'true') {
      query.is24x7 = true;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { locality: searchRegex },
        { pincode: searchRegex },
        { specialities: { $in: [searchRegex] } },
        { address: searchRegex },
      ];
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [hospitals, total] = await Promise.all([
      Hospital.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('bedInventory')
        .populate('emergencyDetails')
        .lean(),
      Hospital.countDocuments(query),
    ]);

    return { hospitals, total, totalPages: Math.ceil(total / limit), currentPage: page };
  }

  async getNearbyHospitals({ lng, lat, maxDistanceKm = 25, emergency, type, speciality, limit = 20 }) {
    const distanceInMeters = maxDistanceKm * 1000;

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

    if (emergency === 'true') filter.hasEmergency = true;
    if (type && type !== 'All') filter.type = type;
    if (speciality && speciality !== 'All') filter.specialities = { $in: [new RegExp(speciality, 'i')] };

    const hospitals = await Hospital.find(filter)
      .limit(limit)
      .populate('bedInventory')
      .populate('emergencyDetails')
      .lean();

    return hospitals.map((hosp) => {
      const [hospLng, hospLat] = hosp.location.coordinates;
      const distance = calculateDistanceKm(lat, lng, hospLat, hospLng);
      return { ...hosp, distance };
    });
  }

  async getHospitalById(id) {
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
    return hospital;
  }

  async createHospital(hospitalData, user, ip) {
    const slug = createSlug(hospitalData.name);
    const isPlatformAdmin = user.role === 'platform_admin';

    const hospital = await Hospital.create({
      ...hospitalData,
      slug,
      location: {
        type: 'Point',
        coordinates: [parseFloat(hospitalData.longitude), parseFloat(hospitalData.latitude)],
      },
      isVerified: isPlatformAdmin,
      verificationStatus: isPlatformAdmin ? 'approved' : 'pending',
      adminId: user._id,
    });

    await BedInventory.create({
      hospitalId: hospital._id,
      totalBeds: parseInt(hospitalData.totalBeds, 10) || 100,
      occupiedBeds: parseInt(hospitalData.occupiedBeds, 10) || 60,
      availableBeds: parseInt(hospitalData.availableBeds, 10) || 40,
      icuBeds: { total: 20, available: 6 },
      oxygenBeds: { total: 40, available: 15 },
      ventilatorBeds: { total: 10, available: 3 },
      updatedBy: user._id,
    });

    await EmergencyService.create({
      hospitalId: hospital._id,
      ambulanceNumber: hospitalData.emergencyPhone || hospitalData.phone,
      directEmergencyHotline: hospitalData.emergencyPhone || hospitalData.phone,
      traumaLevel: 'Level 2 Major Trauma',
      bloodBankAvailable: true,
      cardiacEmergencyReady: true,
      strokeCenterReady: true,
    });

    user.managedHospital = hospital._id;
    await user.save();

    await recordAuditLog({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'HOSPITAL_CREATED',
      entityType: 'Hospital',
      entityId: hospital._id,
      details: { name: hospital.name, isVerified: hospital.isVerified },
      ipAddress: ip,
    });

    return hospital;
  }
}

module.exports = new HospitalService();
