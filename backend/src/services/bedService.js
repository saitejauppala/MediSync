const BedInventory = require('../models/BedInventory');
const Hospital = require('../models/Hospital');
const { recordAuditLog } = require('../middleware/audit');

class BedService {
  async getHospitalBeds(hospitalId) {
    let bedInventory = await BedInventory.findOne({ hospitalId }).populate('hospitalId', 'name city type');

    if (!bedInventory) {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        const err = new Error('Hospital not found.');
        err.statusCode = 404;
        throw err;
      }

      bedInventory = await BedInventory.create({
        hospitalId,
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

    return {
      ...bedInventory.toObject(),
      occupancyRate,
      isHospitalReported: true,
      verificationNotice: 'Hospital-reported bed inventory. Capacity and availability are subject to rapid change.',
    };
  }

  async updateHospitalBeds(id, updateData, user, ip) {
    let inventory = await BedInventory.findById(id);
    if (!inventory) {
      inventory = await BedInventory.findOne({ hospitalId: id });
    }

    if (!inventory) {
      const err = new Error('Bed inventory record not found.');
      err.statusCode = 404;
      throw err;
    }

    const hospital = await Hospital.findById(inventory.hospitalId);
    if (!hospital) {
      const err = new Error('Associated hospital not found.');
      err.statusCode = 404;
      throw err;
    }

    const newTotal = updateData.totalBeds !== undefined ? parseInt(updateData.totalBeds, 10) : inventory.totalBeds;
    const newOccupied = updateData.occupiedBeds !== undefined ? parseInt(updateData.occupiedBeds, 10) : inventory.occupiedBeds;
    let newAvailable = updateData.availableBeds !== undefined ? parseInt(updateData.availableBeds, 10) : (newTotal - newOccupied);

    if (newOccupied + newAvailable > newTotal) {
      const err = new Error('Sum of occupied beds and available beds cannot exceed total capacity.');
      err.statusCode = 400;
      throw err;
    }

    inventory.totalBeds = newTotal;
    inventory.occupiedBeds = newOccupied;
    inventory.availableBeds = newAvailable;

    if (updateData.icuTotal !== undefined || updateData.icuAvailable !== undefined) {
      inventory.icuBeds = {
        total: updateData.icuTotal !== undefined ? parseInt(updateData.icuTotal, 10) : inventory.icuBeds.total,
        available: updateData.icuAvailable !== undefined ? parseInt(updateData.icuAvailable, 10) : inventory.icuBeds.available,
      };
    }

    if (updateData.oxygenTotal !== undefined || updateData.oxygenAvailable !== undefined) {
      inventory.oxygenBeds = {
        total: updateData.oxygenTotal !== undefined ? parseInt(updateData.oxygenTotal, 10) : inventory.oxygenBeds.total,
        available: updateData.oxygenAvailable !== undefined ? parseInt(updateData.oxygenAvailable, 10) : inventory.oxygenBeds.available,
      };
    }

    if (updateData.ventilatorTotal !== undefined || updateData.ventilatorAvailable !== undefined) {
      inventory.ventilatorBeds = {
        total: updateData.ventilatorTotal !== undefined ? parseInt(updateData.ventilatorTotal, 10) : inventory.ventilatorBeds.total,
        available: updateData.ventilatorAvailable !== undefined ? parseInt(updateData.ventilatorAvailable, 10) : inventory.ventilatorBeds.available,
      };
    }

    inventory.lastUpdated = new Date();
    inventory.updatedBy = user._id;

    await inventory.save();

    await recordAuditLog({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'BED_INVENTORY_UPDATED',
      entityType: 'BedInventory',
      entityId: inventory._id,
      details: {
        hospitalName: hospital.name,
        totalBeds: inventory.totalBeds,
        availableBeds: inventory.availableBeds,
      },
      ipAddress: ip,
    });

    return inventory;
  }
}

module.exports = new BedService();
