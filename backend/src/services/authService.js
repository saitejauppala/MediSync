const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/environment');
const { recordAuditLog } = require('../middleware/audit');

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
  }

  async registerUser({ name, email, password, role, phone }, ip) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error('An account with this email address already exists.');
      err.statusCode = 400;
      throw err;
    }

    const assignedRole = role === 'hospital_admin' ? 'hospital_admin' : 'patient';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      phone: phone || '',
    });

    const token = this.generateToken(user._id);

    await recordAuditLog({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      details: { role: user.role, name: user.name },
      ipAddress: ip,
    });

    return { user, token };
  }

  async loginUser({ email, password }, ip) {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('managedHospital');

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Your account is deactivated. Contact platform administrator.');
      err.statusCode = 403;
      throw err;
    }

    const token = this.generateToken(user._id);

    await recordAuditLog({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'Auth',
      entityId: user._id,
      details: { ip },
      ipAddress: ip,
    });

    return { user, token };
  }
}

module.exports = new AuthService();
