const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: (coordinates) => (
        coordinates.length === 2
        && Number.isFinite(coordinates[0])
        && Number.isFinite(coordinates[1])
        && coordinates[0] >= -180
        && coordinates[0] <= 180
        && coordinates[1] >= -90
        && coordinates[1] <= 90
      ),
      message: 'Location coordinates must be valid [longitude, latitude] values.',
    },
  },
}, { _id: false });

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Government', 'Private', 'Semi-Government', 'Autonomous', 'Unknown'],
      required: true,
      default: 'Unknown',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    locality: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    location: {
      type: pointSchema,
      required: [true, 'Hospital GeoJSON coordinates are required'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyPhone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    dataSource: {
      type: String,
      enum: ['hospital', 'openstreetmap'],
      default: 'hospital',
      index: true,
    },
    sourceReference: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    operatingHours: {
      type: String,
      default: 'Hours not listed',
    },
    is24x7: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasEmergency: {
      type: Boolean,
      default: false,
      index: true,
    },
    facilities: {
      type: [String],
      default: [],
    },
    specialities: {
      type: [String],
      default: [],
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2dsphere index for location [longitude, latitude]
hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ name: 'text', address: 'text', city: 'text', locality: 'text' });

// Virtual relation to BedInventory
hospitalSchema.virtual('bedInventory', {
  ref: 'BedInventory',
  localField: '_id',
  foreignField: 'hospitalId',
  justOne: true,
});

// Virtual relation to EmergencyService
hospitalSchema.virtual('emergencyDetails', {
  ref: 'EmergencyService',
  localField: '_id',
  foreignField: 'hospitalId',
  justOne: true,
});

module.exports = mongoose.model('Hospital', hospitalSchema);
