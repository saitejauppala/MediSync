const Review = require('../models/Review');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');
const { recordAuditLog } = require('../middleware/audit');

// @desc    Get reviews for a hospital
// @route   GET /api/hospitals/:id/reviews
// @access  Public
const getHospitalReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ hospitalId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('patientId', 'name avatar')
        .lean(),
      Review.countDocuments({ hospitalId: id }),
    ]);

    res.json({
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review for hospital
// @route   POST /api/hospitals/:id/reviews
// @access  Private (patient)
const addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, waitTimeMinutes, cleanlinessRating, staffFriendlinessRating } = req.body;

    if (!rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rating, title and review comment.',
      });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    // Check if patient had an appointment at this hospital
    const hasAppointment = await Appointment.findOne({
      patientId: req.user._id,
      hospitalId: id,
    });

    const review = await Review.create({
      patientId: req.user._id,
      hospitalId: id,
      patientName: req.user.name,
      rating: parseFloat(rating),
      title,
      comment,
      waitTimeMinutes: waitTimeMinutes ? parseInt(waitTimeMinutes, 10) : 15,
      cleanlinessRating: cleanlinessRating ? parseInt(cleanlinessRating, 10) : 5,
      staffFriendlinessRating: staffFriendlinessRating ? parseInt(staffFriendlinessRating, 10) : 5,
      isVerifiedVisit: !!hasAppointment,
    });

    // Update hospital aggregate rating
    const allReviews = await Review.find({ hospitalId: id });
    const avgRating = allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;

    hospital.rating = Math.round(avgRating * 10) / 10;
    hospital.reviewCount = allReviews.length;
    await hospital.save();

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'REVIEW_SUBMITTED',
      entityType: 'Review',
      entityId: review._id,
      details: { hospitalName: hospital.name, rating },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published.',
      review,
      newAverageRating: hospital.rating,
      reviewCount: hospital.reviewCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHospitalReviews,
  addReview,
};

