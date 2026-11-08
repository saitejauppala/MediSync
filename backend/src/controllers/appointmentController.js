const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');
const { recordAuditLog } = require('../middleware/audit');

// @desc    Request an appointment
// @route   POST /api/appointments
// @access  Private (patient)
const createAppointment = async (req, res, next) => {
  try {
    const {
      hospitalId,
      department,
      preferredDate,
      preferredTime,
      patientName,
      patientEmail,
      patientPhone,
      patientAge,
      patientGender,
      reasonForVisit,
    } = req.body;

    if (!hospitalId || !department || !preferredDate || !preferredTime || !reasonForVisit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required appointment fields.',
      });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found.',
      });
    }

    const apptDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (apptDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past.',
      });
    }

    // Check for duplicate pending appointment for the same user, hospital and date
    const existingBooking = await Appointment.findOne({
      patientId: req.user._id,
      hospitalId,
      preferredDate: {
        $gte: new Date(apptDate.setHours(0, 0, 0, 0)),
        $lte: new Date(apptDate.setHours(23, 59, 59, 999)),
      },
      status: 'pending',
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active pending appointment request at this hospital for this date.',
      });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      hospitalId,
      department,
      preferredDate: new Date(preferredDate),
      preferredTime,
      patientName: patientName || req.user.name,
      patientEmail: patientEmail || req.user.email,
      patientPhone: patientPhone || req.user.phone || '',
      patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
      patientGender: patientGender || 'Male',
      reasonForVisit,
      status: 'pending',
    });

    // Create confirmation alert for patient
    await Notification.create({
      userId: req.user._id,
      title: 'Appointment Request Submitted',
      message: `Your appointment request at ${hospital.name} for ${department} on ${new Date(preferredDate).toLocaleDateString()} (${preferredTime}) has been received and is pending hospital review.`,
      type: 'appointment_update',
      link: '/patient/appointments',
    });

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'APPOINTMENT_REQUESTED',
      entityType: 'Appointment',
      entityId: appointment._id,
      details: { hospitalName: hospital.name, department, preferredTime },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully. It will be reviewed by the hospital administration.',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient's appointments
// @route   GET /api/appointments/my
// @access  Private (patient)
const getMyAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { patientId: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('hospitalId', 'name address city phone images emergencyPhone')
      .sort({ preferredDate: -1, createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hospital appointments
// @route   GET /api/appointments/hospital/:id
// @access  Private (hospital_admin, platform_admin)
const getHospitalAppointments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, date } = req.query;

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    // Authorization
    const isOwner = req.user.role === 'hospital_admin' && (
      (hospital.adminId && hospital.adminId.toString() === req.user._id.toString()) ||
      (req.user.managedHospital && req.user.managedHospital.toString() === hospital._id.toString())
    );
    const isPlatformAdmin = req.user.role === 'platform_admin';

    if (!isOwner && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view appointments for this hospital.',
      });
    }

    const query = { hospitalId: id };
    if (status && status !== 'All') {
      query.status = status;
    }

    if (date) {
      const d = new Date(date);
      query.preferredDate = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone avatar')
      .sort({ preferredDate: 1, createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status (Confirm, Reject, Complete)
// @route   PATCH /api/appointments/:id/status
// @access  Private (hospital_admin, platform_admin)
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, hospitalNotes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const appointment = await Appointment.findById(id).populate('hospitalId');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const hospital = appointment.hospitalId;
    const isOwner = req.user.role === 'hospital_admin' && (
      (hospital.adminId && hospital.adminId.toString() === req.user._id.toString()) ||
      (req.user.managedHospital && req.user.managedHospital.toString() === hospital._id.toString())
    );
    const isPlatformAdmin = req.user.role === 'platform_admin';

    if (!isOwner && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this appointment.',
      });
    }

    appointment.status = status;
    if (hospitalNotes !== undefined) {
      appointment.hospitalNotes = hospitalNotes;
    }
    await appointment.save();

    // Alert patient
    let title = `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    let message = `Your appointment at ${hospital.name} on ${new Date(appointment.preferredDate).toLocaleDateString()} has been marked as ${status}.`;
    if (hospitalNotes) {
      message += ` Hospital note: "${hospitalNotes}"`;
    }

    await Notification.create({
      userId: appointment.patientId,
      title,
      message,
      type: 'appointment_update',
      link: '/patient/appointments',
    });

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: `APPOINTMENT_${status.toUpperCase()}`,
      entityType: 'Appointment',
      entityId: appointment._id,
      details: { status, hospitalName: hospital.name, notes: hospitalNotes },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Appointment successfully marked as ${status}.`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an appointment
// @route   DELETE /api/appointments/:id
// @access  Private (patient or hospital_admin)
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id).populate('hospitalId');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const isPatient = appointment.patientId.toString() === req.user._id.toString();
    const isHospitalAdmin = req.user.role === 'hospital_admin' && (
      (appointment.hospitalId.adminId && appointment.hospitalId.adminId.toString() === req.user._id.toString()) ||
      (req.user.managedHospital && req.user.managedHospital.toString() === appointment.hospitalId._id.toString())
    );
    const isPlatformAdmin = req.user.role === 'platform_admin';

    if (!isPatient && !isHospitalAdmin && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot cancel this appointment.',
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = isPatient ? 'patient' : isHospitalAdmin ? 'hospital' : 'admin';
    appointment.cancellationReason = reason || 'Cancelled by user';
    await appointment.save();

    // Notify patient if cancelled by hospital/admin
    if (!isPatient) {
      await Notification.create({
        userId: appointment.patientId,
        title: 'Appointment Cancelled',
        message: `Your appointment at ${appointment.hospitalId.name} has been cancelled: ${reason || 'No reason provided'}`,
        type: 'appointment_update',
        link: '/patient/appointments',
      });
    }

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'APPOINTMENT_CANCELLED',
      entityType: 'Appointment',
      entityId: appointment._id,
      details: { cancelledBy: appointment.cancelledBy, reason },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully.',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getHospitalAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};

