const BedInventory = require('../models/BedInventory');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { recordAuditLog } = require('../middleware/audit');

const parseBedCount = (value, label, fallback) => {
  if ((value === undefined || value === null || value === '') && fallback !== undefined) {
    return fallback;
  }

  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && /^\d+$/.test(value.trim())
      ? Number(value)
      : NaN;
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    const error = new Error(`${label} must be a non-negative whole number.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

// @desc    Get bed inventory for a hospital
// @route   GET /api/hospitals/:id/beds
// @access  Public
const getHospitalBeds = async (req, res, next) => {
  try {
    const { id } = req.params;

    let bedInventory = await BedInventory.findOne({ hospitalId: id }).populate('hospitalId', 'name city type');

    if (!bedInventory) {
      const hospital = await Hospital.findById(id).select('dataSource');
      if (!hospital) {
        return res.status(404).json({ success: false, message: 'Hospital not found.' });
      }

      return res.status(404).json({
        success: false,
        message: hospital.dataSource === 'openstreetmap'
          ? 'Bed availability has not been reported for this community-sourced listing.'
          : 'Bed availability has not been reported by this hospital.',
      });
    }

    const occupancyRate = bedInventory.totalBeds > 0
      ? Math.round((bedInventory.occupiedBeds / bedInventory.totalBeds) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        ...bedInventory.toObject(),
        occupancyRate,
        isHospitalReported: true,
        verificationNotice: 'Hospital-reported bed inventory. Capacity and availability are subject to rapid change. In emergencies, contact the facility directly.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital bed inventory
// @route   PATCH /api/beds/:id
// @access  Private (hospital_admin, platform_admin)
const updateHospitalBeds = async (req, res, next) => {
  try {
    const { id } = req.params; // this can be bedInventory id or hospitalId
    let inventory = await BedInventory.findById(id);
    if (!inventory) {
      inventory = await BedInventory.findOne({ hospitalId: id });
    }

    const hospital = await Hospital.findById(inventory ? inventory.hospitalId : id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Associated hospital not found.' });
    }

    if (hospital.dataSource === 'openstreetmap') {
      return res.status(400).json({
        success: false,
        message: 'Community-sourced listings cannot publish bed availability.',
      });
    }

    // Authorization
    const isOwner = req.user.role === 'hospital_admin' && (
      (hospital.adminId && hospital.adminId.toString() === req.user._id.toString()) ||
      (req.user.managedHospital && req.user.managedHospital.toString() === hospital._id.toString())
    );
    const isPlatformAdmin = req.user.role === 'platform_admin';

    if (!isOwner && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this hospital bed inventory.',
      });
    }

    const {
      totalBeds,
      occupiedBeds,
      availableBeds,
      icuTotal,
      icuAvailable,
      oxygenTotal,
      oxygenAvailable,
      ventilatorTotal,
      ventilatorAvailable,
    } = req.body;

    if (!inventory && [
      totalBeds, occupiedBeds, availableBeds, icuTotal, icuAvailable,
      oxygenTotal, oxygenAvailable, ventilatorTotal, ventilatorAvailable,
    ].some((value) => value === undefined || value === null || value === '')) {
      return res.status(400).json({
        success: false,
        message: 'Enter the hospital-reported total, occupied, available, ICU, oxygen, and ventilator bed counts before publishing availability.',
      });
    }

    const newTotal = parseBedCount(totalBeds, 'Total beds', inventory?.totalBeds);
    const newOccupied = parseBedCount(occupiedBeds, 'Occupied beds', inventory?.occupiedBeds);
    const newAvailable = parseBedCount(
      availableBeds,
      'Available beds',
      newTotal - newOccupied
    );

    if (newOccupied + newAvailable > newTotal) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: The sum of occupied beds and available beds cannot exceed total capacity.',
      });
    }

    const getSpecialtyCounts = (total, available, current, label) => {
      const reportedTotal = parseBedCount(total, `${label} total`, current?.total ?? 0);
      const reportedAvailable = parseBedCount(available, `${label} available`, current?.available ?? 0);
      if (reportedAvailable > reportedTotal) {
        const error = new Error(`Available ${label.toLowerCase()} beds cannot exceed total ${label.toLowerCase()} beds.`);
        error.statusCode = 400;
        throw error;
      }
      return { total: reportedTotal, available: reportedAvailable };
    };

    const reportedIcuBeds = getSpecialtyCounts(icuTotal, icuAvailable, inventory?.icuBeds, 'ICU');
    const reportedOxygenBeds = getSpecialtyCounts(oxygenTotal, oxygenAvailable, inventory?.oxygenBeds, 'Oxygen');
    const reportedVentilatorBeds = getSpecialtyCounts(
      ventilatorTotal,
      ventilatorAvailable,
      inventory?.ventilatorBeds,
      'Ventilator'
    );

    inventory = inventory || new BedInventory({ hospitalId: hospital._id });
    inventory.totalBeds = newTotal;
    inventory.occupiedBeds = newOccupied;
    inventory.availableBeds = newAvailable;
    inventory.icuBeds = reportedIcuBeds;
    inventory.oxygenBeds = reportedOxygenBeds;
    inventory.ventilatorBeds = reportedVentilatorBeds;

    inventory.lastUpdated = new Date();
    inventory.updatedBy = req.user._id;

    await inventory.save();

    const subscribers = await User.find({
      role: 'patient',
      savedHospitals: hospital._id,
    }).select('_id').lean();

    if (subscribers.length > 0) {
      const message = `${hospital.name} updated its reported bed availability: ${inventory.availableBeds} of ${inventory.totalBeds} beds are currently available. Contact the hospital to confirm availability.`;
      await Notification.insertMany(subscribers.map(({ _id }) => ({
        userId: _id,
        title: 'Hospital bed availability updated',
        message,
        type: 'inventory_alert',
        link: `/hospitals/${hospital._id}`,
      })));
    }

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'BED_INVENTORY_UPDATED',
      entityType: 'BedInventory',
      entityId: inventory._id,
      details: {
        hospitalName: hospital.name,
        totalBeds: inventory.totalBeds,
        availableBeds: inventory.availableBeds,
        occupiedBeds: inventory.occupiedBeds,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: subscribers.length > 0
        ? `Bed inventory successfully updated and broadcast to ${subscribers.length} patient${subscribers.length === 1 ? '' : 's'} who saved this hospital.`
        : 'Bed inventory updated successfully. No patients have saved this hospital yet, so no broadcast was sent.',
      broadcastedTo: subscribers.length,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHospitalBeds,
  updateHospitalBeds,
};
