require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const Department = require('../models/Department');
const Hospital = require('../models/Hospital');
const departmentsData = require('../data/departments');
const vijayawadaHospitals = require('../data/vijayawadaHospitals');

const seedDB = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed script is for local development only and cannot run in production.');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('Set MONGODB_URI to a persistent local or disposable database before importing data.');
  }

  let connected = false;
  try {
    await connectDB();
    connected = true;

    await Department.bulkWrite(departmentsData.map((department) => ({
      updateOne: {
        filter: { slug: department.slug },
        update: { $setOnInsert: department },
        upsert: true,
      },
    })));

    await Hospital.bulkWrite(vijayawadaHospitals.map((entry) => {
      const sourceReference = `https://www.openstreetmap.org/${entry.osmId}`;
      return {
        updateOne: {
          filter: { sourceReference },
          update: {
            $setOnInsert: {
              name: entry.name,
              slug: `vijayawada-${entry.osmId.replace('/', '-')}`,
              type: entry.type || 'Unknown',
              description: 'Community-sourced OpenStreetMap listing. Details have not been independently verified by MediSync.',
              address: entry.address || '',
              city: 'Vijayawada',
              state: 'Andhra Pradesh',
              pincode: entry.pincode || '',
              location: { type: 'Point', coordinates: entry.coordinates },
              phone: entry.phone || '',
              website: entry.website || '',
              operatingHours: entry.operatingHours || 'Hours not listed',
              is24x7: entry.is24x7 || false,
              hasEmergency: entry.hasEmergency || false,
              specialities: entry.specialities || [],
              isVerified: false,
              verificationStatus: 'pending',
              rating: 0,
              reviewCount: 0,
              dataSource: 'openstreetmap',
              sourceReference,
            },
          },
          upsert: true,
        },
      };
    }));

    console.log(`Imported ${vijayawadaHospitals.length} unverified Vijayawada OpenStreetMap records; existing records were preserved.`);
  } finally {
    if (connected) await disconnectDB();
  }
};

if (require.main === module) {
  seedDB().catch((error) => {
    console.error('Unable to import Vijayawada directory data:', error.message);
    process.exitCode = 1;
  });
}

module.exports = seedDB;
