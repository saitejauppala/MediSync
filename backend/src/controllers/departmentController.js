const Department = require('../models/Department');
const Hospital = require('../models/Hospital');

// @desc    Get all medical departments
// @route   GET /api/departments
// @access  Public
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get departments and specialities offered by a hospital
// @route   GET /api/hospitals/:id/departments
// @access  Public
const getHospitalDepartments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospital = await Hospital.findById(id);

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    res.json({
      success: true,
      hospitalName: hospital.name,
      specialities: hospital.specialities,
      facilities: hospital.facilities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create department (Platform Admin)
// @route   POST /api/departments
// @access  Private (platform_admin)
const createDepartment = async (req, res, next) => {
  try {
    const { name, icon, description, commonTreatments, isEmergencySupported } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Department name and description are required.',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const department = await Department.create({
      name,
      slug,
      icon: icon || 'Activity',
      description,
      commonTreatments: commonTreatments || [],
      isEmergencySupported: !!isEmergencySupported,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getHospitalDepartments,
  createDepartment,
};

