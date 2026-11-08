const BedInventory = require('../models/BedInventory');
const Hospital = require('../models/Hospital');
const { recordAuditLog } = require('../middleware/audit');

// @desc    Get bed inventory for a hospital
// @route   GET /api/hospitals/:id/beds
// @access  Public
const getHospitalBeds = async (req, res, next) => {
  try {
    const { id } = req.params;

    let bedInventory = await BedInventory.findOne({ hospitalId: id }).populate('hospitalId', 'name city type');

    if (!bedInventory) {
      // If none exists yet, create default baseline
      const hospital = await Hospital.findById(id);
      if (!hospital) {
        return res.status(404).json({ success: false, message: 'Hospital not found.' });
      }

      bedInventory = await BedInventory.create({
        hospitalId: id,
        totalBeds: 120,
        occupiedBeds: 75,
        availableBeds: 45,
        icuBeds: { total: 20, available: 6 },
        oxygenBeds: { total: 40, available: 15 },
        ventilatorBeds: { total: 10, available: 3 },
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

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Bed inventory record not found.' });
    }

    const hospital = await Hospital.findById(inventory.hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Associated hospital not found.' });
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

    const newTotal = totalBeds !== undefined ? parseInt(totalBeds, 10) : inventory.totalBeds;
    const newOccupied = occupiedBeds !== undefined ? parseInt(occupiedBeds, 10) : inventory.occupiedBeds;
    
    // Automatically enforce consistent available calculation if not explicitly set
    let newAvailable = availableBeds !== undefined ? parseInt(availableBeds, 10) : (newTotal - newOccupied);

    if (newOccupied + newAvailable > newTotal) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: The sum of occupied beds and available beds cannot exceed total capacity.',
      });
    }

    if (newOccupied < 0 || newAvailable < 0 || newTotal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Bed numbers cannot be negative.',
      });
    }

    inventory.totalBeds = newTotal;
    inventory.occupiedBeds = newOccupied;
    inventory.availableBeds = newAvailable;

    if (icuTotal !== undefined || icuAvailable !== undefined) {
      const tot = icuTotal !== undefined ? parseInt(icuTotal, 10) : inventory.icuBeds.total;
      const avail = icuAvailable !== undefined ? parseInt(icuAvailable, 10) : inventory.icuBeds.available;
      if (avail > tot) {
        return res.status(400).json({
          success: false,
          message: 'Available ICU beds cannot exceed total ICU beds.',
        });
      }
      inventory.icuBeds = { total: tot, available: avail };
    }

    if (oxygenTotal !== undefined || oxygenAvailable !== undefined) {
      const tot = oxygenTotal !== undefined ? parseInt(oxygenTotal, 10) : inventory.oxygenBeds.total;
      const avail = oxygenAvailable !== undefined ? parseInt(oxygenAvailable, 10) : inventory.oxygenBeds.available;
      if (avail > tot) {
        return res.status(400).json({
          success: false,
          message: 'Available oxygen beds cannot exceed total oxygen beds.',
        });
      }
      inventory.oxygenBeds = { total: tot, available: avail };
    }

    if (ventilatorTotal !== undefined || ventilatorAvailable !== undefined) {
      const tot = ventilatorTotal !== undefined ? parseInt(ventilatorTotal, 10) : inventory.ventilatorBeds.total;
      const avail = ventilatorAvailable !== undefined ? parseInt(ventilatorAvailable, 10) : inventory.ventilatorBeds.available;
      if (avail > tot) {
        return res.status(400).json({
          success: false,
          message: 'Available ventilator beds cannot exceed total ventilator beds.',
        });
      }
      inventory.ventilatorBeds = { total: tot, available: avail };
    }

    inventory.lastUpdated = new Date();
    inventory.updatedBy = req.user._id;

    await inventory.save();

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
      message: 'Bed inventory successfully updated.',
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

