const mongoose = require('mongoose');

const emergencyServiceSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      unique: true,
      index: true,
    },
    ambulanceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    directEmergencyHotline: {
      type: String,
      required: true,
      trim: true,
    },
    traumaLevel: {
      type: String,
      enum: ['Level 1 Comprehensive', 'Level 2 Major Trauma', 'Level 3 General Trauma', 'Basic Emergency Response'],
      default: 'Level 2 Major Trauma',
    },
    helipadAvailable: {
      type: Boolean,
      default: false,
    },
    bloodBankAvailable: {
      type: Boolean,
      default: true,
    },
    burnUnitAvailable: {
      type: Boolean,
      default: false,
    },
    strokeCenterReady: {
      type: Boolean,
      default: true,
    },
    cardiacEmergencyReady: {
      type: Boolean,
      default: true,
    },
    pediatricEmergencyReady: {
      type: Boolean,
      default: true,
    },
    operatingStatus: {
      type: String,
      enum: ['Open 24/7', 'Daytime Emergency Only', 'On-Call Only'],
      default: 'Open 24/7',
    },
    disclaimer: {
      type: String,
      default: 'MediSync is an informational discovery platform, not an emergency dispatch provider. In life-threatening emergencies, dial national emergency services (112, 911, or 108) immediately.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EmergencyService', emergencyServiceSchema);

