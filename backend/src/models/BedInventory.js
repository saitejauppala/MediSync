const mongoose = require('mongoose');

const bedInventorySchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      unique: true,
      index: true,
    },
    totalBeds: {
      type: Number,
      required: true,
      min: [0, 'Total beds cannot be negative'],
    },
    occupiedBeds: {
      type: Number,
      required: true,
      min: [0, 'Occupied beds cannot be negative'],
    },
    availableBeds: {
      type: Number,
      required: true,
      min: [0, 'Available beds cannot be negative'],
    },
    icuBeds: {
      total: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
    },
    oxygenBeds: {
      total: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
    },
    ventilatorBeds: {
      total: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    disclaimer: {
      type: String,
      default: 'Hospital-reported bed inventory. Capacity and availability are subject to rapid change. In emergencies, contact the facility directly.',
    },
  },
  {
    timestamps: true,
  }
);

// Mathematical consistency validation before saving
bedInventorySchema.pre('save', function (next) {
  if (this.occupiedBeds + this.availableBeds > this.totalBeds) {
    return next(new Error('Sum of occupied beds and available beds cannot exceed total bed capacity'));
  }
  if (this.icuBeds.available > this.icuBeds.total) {
    return next(new Error('Available ICU beds cannot exceed total ICU beds'));
  }
  if (this.oxygenBeds.available > this.oxygenBeds.total) {
    return next(new Error('Available oxygen beds cannot exceed total oxygen beds'));
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('BedInventory', bedInventorySchema);

