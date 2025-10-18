const { UserModal } = require('../../models/User');
const { success, error: sendError, notFound } = require('../../utils/response');
const logger = require('../../utils/logger');
const { NotificationModel } = require('../../models/notification/notification-scheema');

// Helper: resolve recipients from explicit ids and/or roles
async function resolveRecipientIds({ orgNo, recipientIds = [], recipientRoles = [] }) {
	const final = new Set((recipientIds || []).map(id => String(id)).filter(Boolean));
	if (recipientRoles && recipientRoles.length > 0) {
		const users = await UserModal.find({ orgNo, activerole: { $in: recipientRoles }, block_status: false }).select('_id').lean();
		for (const u of users) final.add(String(u._id));
	}
	return Array.from(final);
}

// Create notification (admins/managers typically)
const CreateNotification = async (req, res) => {
	try {
		const orgNo = req.profile?.orgNo
		if (!orgNo) return sendError(res, 'Organization number required');

		const { title, message, type = 'generic', recipients = [], recipientRoles = [], isBroadcast = false, action = {}, channels = ['IN_APP'], priority = 'MEDIUM' } = req.body;
		if (!title || !message) return sendError(res, 'title and message are required');

		let recipientIds = [];
		if (!isBroadcast) {
			recipientIds = await resolveRecipientIds({ orgNo, recipientIds: recipients, recipientRoles });
			if (!recipientIds || recipientIds.length === 0) return sendError(res, 'No recipients resolved for notification');
		}

		// Build payload
		const payload = {
			orgNo,
			title,
			message,
			type,
			channels,
			priority,
			isBroadcast,
			recipientRoles: recipientRoles || [],
			action
		};

		if (isBroadcast) {
			// Create broadcast notification document (no recipients list)
			const doc = new NotificationModel({ ...payload });
			await doc.save();
			return success(res, 'Broadcast notification created', doc);
		}

		const doc = await NotificationModel.createForRecipients(payload, recipientIds);
		return success(res, 'Notification created', doc);
	} catch (err) {
		logger.error('CreateNotification error', err);
		return sendError(res, err.message || 'Could not create notification', err);
	}
};

// List notifications for current user (supports pagination & unread filter)
const GetNotifications = async (req, res) => {
	try {
		const userId = req.profile?._id;
		const orgNo = req.profile?.orgNo;
		const page = Math.max(1, parseInt(req.query.page || '1', 10));
		const limit = Math.min(100, parseInt(req.query.limit || '25', 10));
		const skip = (page - 1) * limit;
		const { unread, type } = req.query;

		// Build match
		const orClauses = [ { 'recipients.recipient': userId }, { recipient: userId }, { isBroadcast: true } ];
		// include recipientRoles where user's activerole matches
		if (req.profile?.activerole) orClauses.push({ recipientRoles: req.profile.activerole });

		const match = { $and: [ { orgNo }, { $or: orClauses } ] };
		if (type) match.type = type;

		// unread means there is a recipients element for this user with read:false OR (legacy recipient field not read)
		if (unread === 'true' || unread === true) {
			match.$and.push({ $or: [ { recipients: { $elemMatch: { recipient: userId, read: false } } }, { recipient: userId, isRead: { $ne: true } } ] });
		}

		const items = await NotificationModel.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
		const total = await NotificationModel.countDocuments(match);
		return success(res, 'Notifications fetched', { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) }});
	} catch (err) {
		logger.error('GetNotifications error', err);
		return sendError(res, err.message || 'Could not fetch notifications', err);
	}
};

// Unread count for current user
const GetUnreadCount = async (req, res) => {
	try {
		const userId = req.profile?._id;
		const orgNo = req.profile?.orgNo;
		const match = { $and: [ { orgNo }, { $or: [ { recipients: { $elemMatch: { recipient: userId, read: false } } }, { recipient: userId, isRead: { $ne: true } } ] } ] };
		const count = await NotificationModel.countDocuments(match);
		return success(res, 'Unread count', { count });
	} catch (err) {
		logger.error('GetUnreadCount error', err);
		return sendError(res, err.message || 'Could not fetch unread count', err);
	}
};

// Mark notification as read for current user
const MarkAsRead = async (req, res) => {
	try {
		const id = req.params.id;
		const userId = req.profile?._id;
		const note = await NotificationModel.findById(id);
		if (!note) return notFound(res, 'Notification not found');
		const updated = await note.markAsRead(userId);
		return success(res, 'Marked as read', updated);
	} catch (err) {
		logger.error('MarkAsRead error', err);
		return sendError(res, err.message || 'Could not mark as read', err);
	}
};

// Mark delivered for a specific channel
const MarkAsDelivered = async (req, res) => {
	try {
		const id = req.params.id;
		const channel = req.body.channel || 'IN_APP';
		const userId = req.profile?._id;
		const note = await NotificationModel.findById(id);
		if (!note) return notFound(res, 'Notification not found');
		const updated = await note.markAsDeliveredFor(userId, channel);
		return success(res, 'Marked as delivered', updated);
	} catch (err) {
		logger.error('MarkAsDelivered error', err);
		return sendError(res, err.message || 'Could not mark as delivered', err);
	}
};

// Dismiss notification for current user
const DismissNotification = async (req, res) => {
	try {
		const id = req.params.id;
		const userId = req.profile?._id;
		const note = await NotificationModel.findById(id);
		if (!note) return notFound(res, 'Notification not found');
		const updated = await note.markAsDismissed(userId);
		return success(res, 'Dismissed notification', updated);
	} catch (err) {
		logger.error('DismissNotification error', err);
		return sendError(res, err.message || 'Could not dismiss notification', err);
	}
};

// Delete notification (admin only) - hard delete
const DeleteNotification = async (req, res) => {
	try {
		const id = req.params.id;
		await NotificationModel.deleteOne({ _id: id });
		return success(res, 'Notification deleted');
	} catch (err) {
		logger.error('DeleteNotification error', err);
		return sendError(res, err.message || 'Could not delete notification', err);
	}
};

module.exports = {
	CreateNotification,
	GetNotifications,
	GetUnreadCount,
	MarkAsRead,
	MarkAsDelivered,
	DismissNotification,
	DeleteNotification
};

