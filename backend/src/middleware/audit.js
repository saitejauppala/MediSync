const AuditLog = require('../models/AuditLog');

const recordAuditLog = async ({
  actorId = null,
  actorEmail = 'system',
  actorRole = 'system',
  action,
  entityType,
  entityId = '',
  details = {},
  ipAddress = '',
}) => {
  try {
    await AuditLog.create({
      actorId,
      actorEmail,
      actorRole,
      action,
      entityType,
      entityId: String(entityId),
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = { recordAuditLog };

