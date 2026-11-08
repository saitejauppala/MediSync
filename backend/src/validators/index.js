const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Valid name is required.' });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Both email and password are required.' });
  }
  next();
};

const validateAppointment = (req, res, next) => {
  const { hospitalId, department, preferredDate, preferredTime, reasonForVisit } = req.body;
  if (!hospitalId || !department || !preferredDate || !preferredTime || !reasonForVisit) {
    return res.status(400).json({ success: false, message: 'Missing required appointment fields.' });
  }
  next();
};

const validateBedUpdate = (req, res, next) => {
  const { totalBeds, occupiedBeds, availableBeds } = req.body;
  if (totalBeds !== undefined && totalBeds < 0) {
    return res.status(400).json({ success: false, message: 'Total beds cannot be negative.' });
  }
  if (occupiedBeds !== undefined && occupiedBeds < 0) {
    return res.status(400).json({ success: false, message: 'Occupied beds cannot be negative.' });
  }
  if (availableBeds !== undefined && availableBeds < 0) {
    return res.status(400).json({ success: false, message: 'Available beds cannot be negative.' });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateAppointment,
  validateBedUpdate,
};

