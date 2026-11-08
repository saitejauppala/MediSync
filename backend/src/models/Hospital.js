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
      enum: ['Government', 'Private', 'Semi-Government', 'Autonomous'],
      required: true,
      default: 'Private',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    locality: {
      type: String,
      trim: true,
      default: '',
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
      required: [true, 'PIN Code is required'],
      trim: true,
      index: true,
    },
    location: {
      type: pointSchema,
      required: [true, 'Hospital GeoJSON coordinates are required'],
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
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
    images: {
      type: [String],
      default: [],
    },
    operatingHours: {
      type: String,
      default: 'Open 24/7',
    },
    is24x7: {
      type: Boolean,
      default: true,
      index: true,
    },
    hasEmergency: {
      type: Boolean,
      default: true,
      index: true,
    },
    facilities: {
      type: [String],
      default: ['Ambulance', 'Pharmacy', 'Emergency Room', 'Diagnostic Lab'],
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
      default: 4.5,
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

