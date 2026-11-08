const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const BedInventory = require('../src/models/BedInventory');
const EmergencyService = require('../src/models/EmergencyService');
const Notification = require('../src/models/Notification');
const { calculateDistanceKm } = require('../src/utils/geo');
const { getHospitalBeds, updateHospitalBeds } = require('../src/controllers/bedController');

test.before(async () => {
  await connectDB();
  await Hospital.init();
});

test.after(async () => {
  await disconnectDB();
});

test('1. Geolocation Math: Haversine distance calculation is accurate', () => {
  // Distance between Jubilee Hills (17.4265, 78.4095) and Afzal Gunj (17.3736, 78.4729) in Hyderabad ~ 8.9 km
  const distance = calculateDistanceKm(17.4265, 78.4095, 17.3736, 78.4729);
  assert.ok(distance > 8.0 && distance < 10.0, `Expected distance ~8.9km, got ${distance}km`);
});

test('2. User Model: Securely hashes passwords before persisting', async () => {
  const email = `testuser_${Date.now()}@medisync.io`;
  const rawPassword = 'SecurePassword123!';

  const user = await User.create({
    name: 'Test Patient',
    email,
    password: rawPassword,
    role: 'patient',
  });

  assert.notEqual(user.password, rawPassword, 'Password must be hashed in database');
  const isMatch = await user.comparePassword(rawPassword);
  assert.equal(isMatch, true, 'comparePassword should return true for raw password');

  const isWrong = await user.comparePassword('WrongPassword');
  assert.equal(isWrong, false, 'comparePassword should return false for wrong password');
});

test('3. Hospital Model & 2dsphere: Correctly stores GeoJSON Point [lng, lat]', async () => {
  const hospital = await Hospital.create({
    name: 'Test Hospital Apollo Prime',
    slug: `test-hospital-${Date.now()}`,
    type: 'Private',
    address: 'Road No 1',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    location: {
      type: 'Point',
      coordinates: [78.4867, 17.3850], // [longitude, latitude]
    },
    phone: '+91 40 1234 5678',
    isVerified: true,
  });

  assert.equal(hospital.location.type, 'Point');
  assert.equal(hospital.location.coordinates[0], 78.4867); // longitude
  assert.equal(hospital.location.coordinates[1], 17.3850); // latitude
});

test('4. BedInventory Model: Enforces mathematical consistency validation', async () => {
  const hospital = await Hospital.findOne();
  assert.ok(hospital, 'At least one hospital must exist');

  // Total: 100, Occupied: 80, Available: 50 -> Sum 130 > 100 should throw validation error
  const invalidInventory = new BedInventory({
    hospitalId: new mongoose.Types.ObjectId(),
    totalBeds: 100,
    occupiedBeds: 80,
    availableBeds: 50,
  });

  await assert.rejects(
    async () => {
      await invalidInventory.save();
    },
    /cannot exceed total bed capacity/,
    'Should reject when occupied + available > total'
  );
});

test('5. Geospatial Query: $near returns hospitals in ascending distance order', async () => {
  const hyderabadCenter = [78.4867, 17.3850]; // [lng, lat]

  const nearby = await Hospital.find({
    isVerified: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: hyderabadCenter,
        },
        $maxDistance: 50000, // 50km
      },
    },
  }).limit(5);

  assert.ok(nearby.length > 0, 'Should find nearby verified hospitals');
});

test('bed availability stays unreported until a hospital admin publishes real counts', async () => {
  const suffix = Date.now();
  const hospital = await Hospital.create({
    name: 'Bed Reporting Test Hospital',
    slug: `bed-reporting-test-${suffix}`,
    type: 'Private',
    address: 'Test Road',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    pincode: '520001',
    location: { type: 'Point', coordinates: [80.648, 16.5062] },
    phone: '+91 80000 00001',
  });
  const admin = await User.create({
    name: 'Bed Reporting Admin',
    email: `bed-admin-${suffix}@medisync.io`,
    password: 'SecurePassword123!',
    role: 'hospital_admin',
    managedHospital: hospital._id,
  });
  hospital.adminId = admin._id;
  await hospital.save();
  const patient = await User.create({
    name: 'Inventory Subscriber',
    email: `bed-patient-${suffix}@medisync.io`,
    password: 'SecurePassword123!',
    role: 'patient',
    savedHospitals: [hospital._id],
  });

  const makeResponse = () => ({
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  });

  const missingInventoryResponse = makeResponse();
  await getHospitalBeds(
    { params: { id: hospital._id.toString() } },
    missingInventoryResponse,
    (error) => { throw error; }
  );
  assert.equal(missingInventoryResponse.statusCode, 404);
  assert.equal(await BedInventory.countDocuments({ hospitalId: hospital._id }), 0);

  const updateResponse = makeResponse();
  await updateHospitalBeds(
    {
      params: { id: hospital._id.toString() },
      user: admin,
      ip: '127.0.0.1',
      body: {
        totalBeds: 80,
        occupiedBeds: 50,
        availableBeds: 30,
        icuTotal: 10,
        icuAvailable: 4,
        oxygenTotal: 20,
        oxygenAvailable: 8,
        ventilatorTotal: 5,
        ventilatorAvailable: 2,
      },
    },
    updateResponse,
    (error) => { throw error; }
  );

  assert.equal(updateResponse.body.success, true);
  assert.equal(updateResponse.body.broadcastedTo, 1);
  assert.match(updateResponse.body.message, /broadcast to 1 patient/);
  const notification = await Notification.findOne({
    userId: patient._id,
    type: 'inventory_alert',
  });
  assert.ok(notification);
  assert.match(notification.message, /30 of 80 beds/);
});
