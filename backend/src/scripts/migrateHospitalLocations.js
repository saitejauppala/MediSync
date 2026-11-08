require('dotenv').config();
const mongoose = require('mongoose');

const isValidCoordinatePair = (longitude, latitude) => (
  Number.isFinite(longitude)
  && Number.isFinite(latitude)
  && longitude >= -180
  && longitude <= 180
  && latitude >= -90
  && latitude <= 90
);

const getLegacyCoordinates = (hospital) => {
  const longitudeValue = hospital.longitude ?? hospital.lng ?? hospital.lon;
  const latitudeValue = hospital.latitude ?? hospital.lat;
  if (
    longitudeValue === null || longitudeValue === undefined || longitudeValue === ''
    || latitudeValue === null || latitudeValue === undefined || latitudeValue === ''
  ) {
    return null;
  }
  const longitude = Number(longitudeValue);
  const latitude = Number(latitudeValue);
  return isValidCoordinatePair(longitude, latitude) ? [longitude, latitude] : null;
};

const migrateHospitalLocations = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Set MONGODB_URI explicitly before running this migration.');
  }

  const applyChanges = process.argv.includes('--apply');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  try {
    const collection = mongoose.connection.collection('hospitals');
    let inspected = 0;
    let alreadyGeoJSON = 0;
    let readyToMigrate = 0;
    let missingOrInvalid = 0;
    let updated = 0;

    for await (const hospital of collection.find({}, {
      projection: {
        _id: 1,
        location: 1,
        longitude: 1,
        latitude: 1,
        lng: 1,
        lon: 1,
        lat: 1,
      },
    })) {
      inspected += 1;
      const validGeoJSON = hospital.location?.type === 'Point'
        && Array.isArray(hospital.location.coordinates)
        && hospital.location.coordinates.length === 2
        && isValidCoordinatePair(...hospital.location.coordinates);

      if (validGeoJSON) {
        alreadyGeoJSON += 1;
        continue;
      }

      if (hospital.location !== undefined) {
        missingOrInvalid += 1;
        continue;
      }

      const coordinates = getLegacyCoordinates(hospital);
      if (!coordinates) {
        missingOrInvalid += 1;
        continue;
      }

      readyToMigrate += 1;
      if (applyChanges) {
        const result = await collection.updateOne(
          { _id: hospital._id, location: { $exists: false } },
          { $set: { location: { type: 'Point', coordinates } } }
        );
        updated += result.modifiedCount;
      }
    }

    if (applyChanges) {
      await collection.createIndex({ location: '2dsphere' });
    }

    console.log(JSON.stringify({
      mode: applyChanges ? 'apply' : 'dry-run',
      inspected,
      alreadyGeoJSON,
      readyToMigrate,
      updated,
      missingOrInvalid,
      recordsDeleted: 0,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

migrateHospitalLocations().catch((error) => {
  console.error('Hospital location migration failed:', error.message);
  process.exitCode = 1;
});
