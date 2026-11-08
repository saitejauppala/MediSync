require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const BedInventory = require('../models/BedInventory');
const EmergencyService = require('../models/EmergencyService');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');

const departmentsData = [
  {
    name: 'Cardiology',
    slug: 'cardiology',
    icon: 'HeartPulse',
    description: 'Comprehensive adult & pediatric heart care, cath lab interventions, bypass surgery, electrophysiology, and preventative cardiology.',
    commonTreatments: ['Angioplasty', 'Coronary Bypass (CABG)', 'Echocardiogram', 'Pacemaker Implantation', 'Heart Failure Management'],
    isEmergencySupported: true,
  },
  {
    name: 'Neurology',
    slug: 'neurology',
    icon: 'Brain',
    description: 'Advanced neuro-critical care, stroke treatment, brain & spine surgery, epilepsy management, and Parkinson’s therapy.',
    commonTreatments: ['Thrombolysis for Stroke', 'Craniotomy', 'Spine Fusion', 'EEG / EMG Diagnostics', 'Deep Brain Stimulation'],
    isEmergencySupported: true,
  },
  {
    name: 'Orthopaedics',
    slug: 'orthopaedics',
    icon: 'Bone',
    description: 'Trauma care, robotic joint replacements, sports injuries, arthroscopy, and corrective spinal surgery.',
    commonTreatments: ['Total Knee Replacement', 'Hip Arthroplasty', 'ACL Reconstruction', 'Complex Fracture Fixation'],
    isEmergencySupported: true,
  },
  {
    name: 'Paediatrics',
    slug: 'paediatrics',
    icon: 'Baby',
    description: 'Neonatal ICU (NICU Level III), pediatric emergency response, childhood vaccination, and pediatric subspecialties.',
    commonTreatments: ['NICU Critical Care', 'Pediatric Surgery', 'Child Immunization', 'Pediatric Asthma Care'],
    isEmergencySupported: true,
  },
  {
    name: 'Dermatology',
    slug: 'dermatology',
    icon: 'Sparkles',
    description: 'Clinical dermatology, laser therapies, skin cancer screening, allergy testing, and cosmetic surgery.',
    commonTreatments: ['Biopsy & Mole Removal', 'Phototherapy', 'Psoriasis Treatment', 'Laser Resurfacing'],
    isEmergencySupported: false,
  },
  {
    name: 'Oncology',
    slug: 'oncology',
    icon: 'ShieldAlert',
    description: 'Multidisciplinary cancer center offering medical oncology, radiation therapy, surgical oncology, and immunotherapy.',
    commonTreatments: ['Chemotherapy', 'Targeted Radiation Therapy', 'Tumor Resection', 'Bone Marrow Transplant'],
    isEmergencySupported: false,
  },
  {
    name: 'Gynaecology',
    slug: 'gynaecology',
    icon: 'HeartHandshake',
    description: 'Maternal-fetal medicine, high-risk obstetrics, laparoscopic surgeries, fertility counseling, and women’s health.',
    commonTreatments: ['Painless Delivery', 'Laparoscopic Hysterectomy', 'Prenatal Care', 'PCOS Management'],
    isEmergencySupported: true,
  },
  {
    name: 'General Medicine',
    slug: 'general-medicine',
    icon: 'Stethoscope',
    description: 'Primary care, lifestyle disease management, diagnostic workups, infectious diseases, and elderly care.',
    commonTreatments: ['Hypertension & Diabetes Care', 'Fever & Infection Management', 'Annual Health Screenings'],
    isEmergencySupported: true,
  },
  {
    name: 'Ophthalmology',
    slug: 'ophthalmology',
    icon: 'Eye',
    description: 'Micro-incision cataract surgeries, retinal disease care, LASIK refractive correction, and glaucoma management.',
    commonTreatments: ['Femto Laser Cataract', 'Glaucoma Shunt', 'LASIK Eye Surgery', 'Diabetic Retinopathy Care'],
    isEmergencySupported: false,
  },
  {
    name: 'ENT',
    slug: 'ent',
    icon: 'Ear',
    description: 'Ear, nose, throat and head-neck surgeries, sinus endoscopy, hearing rehabilitation, and vertigo clinics.',
    commonTreatments: ['Endoscopic Sinus Surgery (FESS)', 'Tympanoplasty', 'Tonsillectomy', 'Cochlear Implants'],
    isEmergencySupported: false,
  },
  {
    name: 'Dentistry',
    slug: 'dentistry',
    icon: 'Smile',
    description: 'Maxillofacial trauma, dental implants, root canal therapy, orthodontics, and restorative oral surgery.',
    commonTreatments: ['Dental Implants', 'Root Canal Therapy', 'Jaw Realignment', 'Smile Design'],
    isEmergencySupported: false,
  },
  {
    name: 'Urology',
    slug: 'urology',
    icon: 'Activity',
    description: 'Laser kidney stone removal, prostate care, robotic urological surgery, and kidney transplants.',
    commonTreatments: ['Laser Lithotripsy', 'TURP Prostate Surgery', 'Dialysis Access', 'Renal Transplant Care'],
    isEmergencySupported: true,
  },
];

const seedHospitals = [
  {
    name: 'Apollo Health City',
    slug: 'apollo-health-city-jubilee-hills',
    type: 'Private',
    description: 'Asia’s first health city, offering tertiary and quaternary care across 50+ specialities with world-class medical infrastructure and JCI accreditation.',
    address: 'Road No. 72, Opposite Bharatiya Vidya Bhavan, Jubilee Hills',
    locality: 'Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    location: {
      type: 'Point',
      coordinates: [78.4095, 17.4265], // [lng, lat]
    },
    phone: '+91 40 2360 7777',
    emergencyPhone: '1066',
    email: 'contact@apollojubilee.com',
    website: 'https://hyderabad.apollohospitals.com',
    images: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    ],
    operatingHours: 'Open 24/7',
    is24x7: true,
    hasEmergency: true,
    facilities: ['24/7 Emergency Care', 'Level 1 Trauma Center', 'Robotic Surgery Suite', 'Helipad', 'Blood Bank', 'Pharmacy', 'Diagnostic Imaging', 'Cath Lab'],
    specialities: ['Cardiology', 'Neurology', 'Orthopaedics', 'Oncology', 'Paediatrics', 'Urology', 'General Medicine'],
    isVerified: true,
    verificationStatus: 'approved',
    rating: 4.8,
    reviewCount: 342,
    beds: { total: 450, occupied: 320, available: 130, icuTotal: 65, icuAvail: 18, oxyTotal: 150, oxyAvail: 45 },
    emergency: {
      ambulanceNumber: '+91 40 2360 7777',
      directEmergencyHotline: '1066',
      traumaLevel: 'Level 1 Comprehensive',
      helipadAvailable: true,
      bloodBankAvailable: true,
      cardiacEmergencyReady: true,
      strokeCenterReady: true,
    },
  },
  {
    name: 'Osmania General Hospital',
    slug: 'osmania-general-hospital-afzal-gunj',
    type: 'Government',
    description: 'Historic premier state-run multi-speciality tertiary care hospital providing round-the-clock affordable and emergency treatment to all sections of society.',
    address: 'Afzal Gunj, High Court Road',
    locality: 'Afzal Gunj',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500012',
    location: {
      type: 'Point',
      coordinates: [78.4729, 17.3736], // [lng, lat]
    },
    phone: '+91 40 2460 0121',
    emergencyPhone: '108',
    email: 'superintendent@osmaniahospital.gov.in',
    website: 'https://osmania.telangana.gov.in',
    images: [
      'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
    ],
    operatingHours: 'Open 24/7',
    is24x7: true,
    hasEmergency: true,
    facilities: ['24/7 Government Emergency Room', 'Blood Bank', 'Free Pharmacy', 'Trauma Ward', 'Mortuary', 'Dialysis Wing'],
    specialities: ['General Medicine', 'Orthopaedics', 'Neurology', 'Paediatrics', 'Gynaecology', 'ENT', 'Dentistry'],
    isVerified: true,
    verificationStatus: 'approved',
    rating: 4.2,
    reviewCount: 512,
    beds: { total: 1100, occupied: 950, available: 150, icuTotal: 120, icuAvail: 15, oxyTotal: 400, oxyAvail: 60 },
    emergency: {
      ambulanceNumber: '108',
      directEmergencyHotline: '+91 40 2460 0121',
      traumaLevel: 'Level 1 Comprehensive',
      helipadAvailable: false,
      bloodBankAvailable: true,
      cardiacEmergencyReady: true,
      strokeCenterReady: true,
    },
  },
  {
    name: 'KIMS Hospitals',
    slug: 'kims-hospitals-secunderabad',
    type: 'Private',
    description: 'Leading multi-disciplinary quaternary healthcare facility specializing in robotic surgery, organ transplantation, and neurosciences.',
    address: '1-8-31/1, Minister Road, Krishna Nagar Colony, Begumpet',
    locality: 'Secunderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500003',
    location: {
      type: 'Point',
      coordinates: [78.4878, 17.4399], // [lng, lat]
    },
    phone: '+91 40 4488 5000',
    emergencyPhone: '+91 40 4488 5100',
    email: 'info@kimshospitals.com',
    website: 'https://www.kimshospitals.com',
    images: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
    ],
    operatingHours: 'Open 24/7',
    is24x7: true,
    hasEmergency: true,
    facilities: ['24/7 Trauma Unit', 'Cath Lab', 'Advanced MRI/CT', 'Blood Bank', 'In-house Pharmacy', 'ICU Care'],
    specialities: ['Cardiology', 'Neurology', 'Urology', 'Orthopaedics', 'General Medicine', 'Gynaecology'],
    isVerified: true,
    verificationStatus: 'approved',
    rating: 4.6,
    reviewCount: 284,
    beds: { total: 500, occupied: 380, available: 120, icuTotal: 80, icuAvail: 22, oxyTotal: 180, oxyAvail: 50 },
    emergency: {
      ambulanceNumber: '+91 40 4488 5100',
      directEmergencyHotline: '+91 40 4488 5100',
      traumaLevel: 'Level 2 Major Trauma',
      helipadAvailable: false,
      bloodBankAvailable: true,
      cardiacEmergencyReady: true,
      strokeCenterReady: true,
    },
  },
  {
    name: 'Nizam’s Institute of Medical Sciences (NIMS)',
    slug: 'nizams-institute-of-medical-sciences-punjagutta',
    type: 'Government',
    description: 'Autonomous apex autonomous university and super-speciality hospital known for high-complexity treatments, research, and advanced clinical care.',
    address: 'Punjagutta, Somajiguda',
    locality: 'Punjagutta',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500082',
    location: {
      type: 'Point',
      coordinates: [78.4554, 17.4239], // [lng, lat]
    },
    phone: '+91 40 2348 9000',
    emergencyPhone: '+91 40 2348 9200',
    email: 'director@nims.edu.in',
    website: 'https://nims.edu.in',
    images: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    ],
    operatingHours: 'Open 24/7',
    is24x7: true,
    hasEmergency: true,
    facilities: ['Level 1 Trauma Center', 'Emergency Resuscitation Unit', 'Blood Bank', 'Organ Transplant Facility'],
    specialities: ['Cardiology', 'Neurology', 'Oncology', 'Urology', 'Orthopaedics', 'Dermatology'],
    isVerified: true,
    verificationStatus: 'approved',
    rating: 4.5,
    reviewCount: 420,
    beds: { total: 1400, occupied: 1180, available: 220, icuTotal: 150, icuAvail: 28, oxyTotal: 500, oxyAvail: 95 },
    emergency: {
      ambulanceNumber: '108',
      directEmergencyHotline: '+91 40 2348 9200',
      traumaLevel: 'Level 1 Comprehensive',
      helipadAvailable: false,
      bloodBankAvailable: true,
      cardiacEmergencyReady: true,
      strokeCenterReady: true,
    },
  },
  {
    name: 'Continental Hospitals',
    slug: 'continental-hospitals-gachibowli',
    type: 'Private',
    description: 'JCI and NABH accredited tertiary-care hospital in the IT Corridor with cutting-edge emergency, cardiology, and oncology units.',
    address: 'Plot No. 3, Road No. 2, IT & Financial District, Nanakramguda, Gachibowli',
    locality: 'Gachibowli',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    location: {
      type: 'Point',
      coordinates: [78.3496, 17.4158], // [lng, lat]
    },
    phone: '+91 40 6700 0000',
    emergencyPhone: '+91 40 6700 0111',
    email: 'info@continentalhospitals.com',
    website: 'https://continentalhospitals.com',
    images: [
      'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
    ],
    operatingHours: 'Open 24/7',
    is24x7: true,
    hasEmergency: true,
    facilities: ['Level 1 Emergency Care', 'Green Corridor Ready', 'Dedicated Stroke Unit', 'ICU', 'Modern Cafeteria', 'Diagnostic Imaging'],
    specialities: ['Cardiology', 'Neurology', 'Orthopaedics', 'Paediatrics', 'Gynaecology', 'General Medicine'],
    isVerified: true,
    verificationStatus: 'approved',
    rating: 4.7,
    reviewCount: 198,
    beds: { total: 350, occupied: 230, available: 120, icuTotal: 50, icuAvail: 16, oxyTotal: 120, oxyAvail: 40 },
    emergency: {
      ambulanceNumber: '+91 40 6700 0111',
      directEmergencyHotline: '+91 40 6700 0111',
      traumaLevel: 'Level 1 Comprehensive',
      helipadAvailable: false,
      bloodBankAvailable: true,
      cardiacEmergencyReady: true,
      strokeCenterReady: true,
    },
  },
  {
    name: 'Manipal Hospital Hal Airport Road',
    slug: 'manipal-hospital-hal-airport-road-bengaluru',
    type: 'Private',
    description: 'Renowned multi-speciality flagship hospital delivering comprehensive healthcare, cardiac surgeries, and organ transplant services.',
    address: '98, HAL Old Airport Rd, Kodihalli',
    locality: 'Kodihalli',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560017',
    location: {
      type: 'Point',
      coordinates: [77.6534, 12.9592], // [lng, lat]
    },
    phone: '+91 80 2502 4444',
    emergencyPhone: '080 2502 4333',
    email: 'info@manipalhospitals.com',
    website: 'https://www.manipalhospitals.com',
    images: [
      'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&auto=format&fit=crop&q=80',
    ],
    operatingHours: 'Open 24/7',
    is24x7: true,
    hasEmergency: true,
    facilities: ['24/7 Emergency Wing', 'Organ Transplant Suite', 'Cardio-Pulmonary ICU', 'Day Care Center'],
    specialities: ['Cardiology', 'Neurology', 'Oncology', 'Orthopaedics', 'Paediatrics', 'Urology'],
    isVerified: true,
    verificationStatus: 'approved',
    rating: 4.8,
    reviewCount: 380,
    beds: { total: 600, occupied: 460, available: 140, icuTotal: 90, icuAvail: 25, oxyTotal: 220, oxyAvail: 70 },
    emergency: {
      ambulanceNumber: '080 2502 4333',
      directEmergencyHotline: '080 2502 4333',
      traumaLevel: 'Level 1 Comprehensive',
      helipadAvailable: true,
      bloodBankAvailable: true,
      cardiacEmergencyReady: true,
      strokeCenterReady: true,
    },
  },
  {
    name: 'Metro City Care Clinic & Hospital',
    slug: 'metro-city-care-clinic-begumpet',
    type: 'Private',
    description: 'New community hospital application undergoing verification. Offers general medicine, dentistry, and outpatient daycare services.',
    address: 'Near Old Airport Road, Begumpet',
    locality: 'Begumpet',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500016',
    location: {
      type: 'Point',
      coordinates: [78.4712, 17.4442],
    },
    phone: '+91 40 2776 1122',
    emergencyPhone: '+91 40 2776 1122',
    email: 'admin@metrocitycare.com',
    website: 'https://metrocitycare.example.com',
    images: ['https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80'],
    operatingHours: '08:00 AM - 10:00 PM',
    is24x7: false,
    hasEmergency: false,
    facilities: ['Outpatient Daycare', 'Diagnostic Lab', 'Dental Clinic', 'Pharmacy'],
    specialities: ['General Medicine', 'Dentistry', 'Dermatology'],
    isVerified: false,
    verificationStatus: 'pending',
    rating: 4.0,
    reviewCount: 15,
    beds: { total: 40, occupied: 20, available: 20, icuTotal: 4, icuAvail: 2, oxyTotal: 15, oxyAvail: 8 },
    emergency: {
      ambulanceNumber: '108',
      directEmergencyHotline: '+91 40 2776 1122',
      traumaLevel: 'Basic Emergency Response',
      helipadAvailable: false,
      bloodBankAvailable: false,
      cardiacEmergencyReady: false,
      strokeCenterReady: false,
    },
  },
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('Clearing existing database collections...');

    await Hospital.init();
    await Promise.all([
      User.deleteMany(),
      Hospital.deleteMany(),
      Department.deleteMany(),
      BedInventory.deleteMany(),
      EmergencyService.deleteMany(),
      Appointment.deleteMany(),
      Review.deleteMany(),
      AuditLog.deleteMany(),
    ]);

    console.log('Seeding standard Medical Departments...');
    await Department.insertMany(departmentsData);

    console.log('Seeding Default System Users with secure hashed passwords...');
    // Platform Administrator
    const platformAdmin = await User.create({
      name: 'Dr. MediSync Administrator',
      email: 'admin@medisync.io',
      password: 'Password123!',
      role: 'platform_admin',
      phone: '+91 99999 11111',
    });

    // Hospital Administrator
    const hospitalAdmin = await User.create({
      name: 'Apollo Hospital Administrator',
      email: 'hospitaladmin@medisync.io',
      password: 'Password123!',
      role: 'hospital_admin',
      phone: '+91 99999 22222',
    });

    // Patient User
    const patientUser = await User.create({
      name: 'Rohan Sharma',
      email: 'patient@medisync.io',
      password: 'Password123!',
      role: 'patient',
      phone: '+91 98765 43210',
    });

    console.log('Seeding Hospitals, Bed Inventories, and Emergency Services...');
    for (let i = 0; i < seedHospitals.length; i++) {
      const hData = seedHospitals[i];
      const { beds, emergency, ...hospitalFields } = hData;

      // Assign first hospital to hospital admin
      if (i === 0) {
        hospitalFields.adminId = hospitalAdmin._id;
      }

      const hospital = await Hospital.create(hospitalFields);

      if (i === 0) {
        hospitalAdmin.managedHospital = hospital._id;
        await hospitalAdmin.save();
      }

      // Create BedInventory
      await BedInventory.create({
        hospitalId: hospital._id,
        totalBeds: beds.total,
        occupiedBeds: beds.occupied,
        availableBeds: beds.available,
        icuBeds: { total: beds.icuTotal, available: beds.icuAvail },
        oxygenBeds: { total: beds.oxyTotal, available: beds.oxyAvail },
        ventilatorBeds: { total: Math.floor(beds.icuTotal * 0.4), available: Math.floor(beds.icuAvail * 0.5) },
        updatedBy: hospitalAdmin._id,
      });

      // Create EmergencyService
      await EmergencyService.create({
        hospitalId: hospital._id,
        ...emergency,
      });

      // Add sample review for verified hospitals
      if (hospital.isVerified) {
        await Review.create({
          patientId: patientUser._id,
          hospitalId: hospital._id,
          patientName: 'Rohan Sharma',
          rating: hospital.rating,
          title: 'Efficient triage and compassionate doctors',
          comment: `Visited the ${hospital.specialities[0]} department. Staff attended promptly, testing turnaround was rapid, and the emergency team was remarkably professional.`,
          waitTimeMinutes: 18,
          isVerifiedVisit: true,
        });
      }
    }

    // Seed sample appointment for patient
    const apolloHosp = await Hospital.findOne({ slug: 'apollo-health-city-jubilee-hills' });
    if (apolloHosp) {
      await Appointment.create({
        patientId: patientUser._id,
        hospitalId: apolloHosp._id,
        department: 'Cardiology',
        preferredDate: new Date(Date.now() + 86400000 * 2), // 2 days ahead
        preferredTime: '10:30 AM',
        patientName: 'Rohan Sharma',
        patientEmail: 'patient@medisync.io',
        patientPhone: '+91 98765 43210',
        patientAge: 32,
        patientGender: 'Male',
        reasonForVisit: 'Routine preventative cardiovascular checkup and ECG analysis.',
        status: 'confirmed',
        hospitalNotes: 'Please report 15 minutes before your time slot at OPD Counter 4.',
      });

      // Save hospital in patient bookmarks
      patientUser.savedHospitals.push(apolloHosp._id);
      await patientUser.save();
    }

    // Audit logs
    await AuditLog.create({
      actorId: platformAdmin._id,
      actorEmail: platformAdmin.email,
      actorRole: platformAdmin.role,
      action: 'SYSTEM_SEEDED',
      entityType: 'System',
      details: {
        hospitalsSeeded: seedHospitals.length,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ MediSync Database Seeded Successfully!');
    console.log('====================================================');
    console.log('Default Seed Accounts:');
    console.log('1. Platform Admin : admin@medisync.io / Password123!');
    console.log('2. Hospital Admin : hospitaladmin@medisync.io / Password123!');
    console.log('3. Patient User   : patient@medisync.io / Password123!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

