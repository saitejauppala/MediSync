const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');
const { recordAuditLog } = require('../middleware/audit');

class AppointmentService {
  async createAppointment(patient, appointmentData, ip) {
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
    } = appointmentData;

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      const err = new Error('Hospital not found.');
      err.statusCode = 404;
      throw err;
    }

    const apptDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (apptDate < today) {
      const err = new Error('Appointment date cannot be in the past.');
      err.statusCode = 400;
      throw err;
    }

    const existingBooking = await Appointment.findOne({
      patientId: patient._id,
      hospitalId,
      preferredDate: {
        $gte: new Date(new Date(preferredDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(preferredDate).setHours(23, 59, 59, 999)),
      },
      status: 'pending',
    });

    if (existingBooking) {
      const err = new Error('You already have an active pending appointment request at this hospital for this date.');
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      hospitalId,
      department,
      preferredDate: new Date(preferredDate),
      preferredTime,
      patientName: patientName || patient.name,
      patientEmail: patientEmail || patient.email,
      patientPhone: patientPhone || patient.phone || '',
      patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
      patientGender: patientGender || 'Male',
      reasonForVisit,
      status: 'pending',
    });

    await Notification.create({
      userId: patient._id,
      title: 'Appointment Request Submitted',
      message: `Your appointment at ${hospital.name} for ${department} on ${new Date(preferredDate).toLocaleDateString()} is pending hospital review.`,
      type: 'appointment_update',
      link: '/patient-dashboard',
    });

    await recordAuditLog({
      actorId: patient._id,
      actorEmail: patient.email,
      actorRole: patient.role,
      action: 'APPOINTMENT_REQUESTED',
      entityType: 'Appointment',
      entityId: appointment._id,
      details: { hospitalName: hospital.name, department, preferredTime },
      ipAddress: ip,
    });

    return appointment;
  }
}

module.exports = new AppointmentService();

