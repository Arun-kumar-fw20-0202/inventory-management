const { NotificationModel } = require('../models/notification/notification-scheema');
const { UserModal } = require('../models/User');
const logger = require('../utils/logger');

/**
 * Resolve recipients by roles and explicit userIds. Optionally always include admins.
 * Parameters:
 * - orgNo: organization number
 * - { roles = [], userIds = [], includeAdmins = false, excludeIds = [] }
 * - payload: { title, message, type, action }
 */
async function sendNotification({ orgNo, roles = [], userIds = [], includeAdmins = true, excludeIds = [], payload = {} }) {
  try {
    const recipientSet = new Set();

    // include explicit userIds
    for (const id of (userIds || [])) {
      if (id) recipientSet.add(String(id));
    }

    // include users by roles
    if (Array.isArray(roles) && roles.length > 0) {
      const users = await UserModal.find({ orgNo, activerole: { $in: roles }, block_status: false }).select('_id').lean();
      for (const u of users) recipientSet.add(String(u._id));
    }

    // optionally always include admins
    if (includeAdmins) {
      const admins = await UserModal.find({ orgNo, activerole: 'admin', block_status: false }).select('_id').lean();
      for (const a of admins) recipientSet.add(String(a._id));
    }

    // remove excluded ids
    for (const ex of (excludeIds || [])) {
      if (ex) recipientSet.delete(String(ex));
    }

    const recipientIds = Array.from(recipientSet);
    if (recipientIds.length === 0) return { ok: true, sent: 0 };

    // call existing model helper
    await NotificationModel.createForRecipients(payload, recipientIds);
    return { ok: true, sent: recipientIds.length };
  } catch (err) {
    logger.error('sendNotification error', err);
    return { ok: false, error: err };
  }
}

module.exports = {
  sendNotification
};
