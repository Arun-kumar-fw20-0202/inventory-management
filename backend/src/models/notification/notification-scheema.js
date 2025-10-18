const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Production-ready Notification schema
 * - Supports multiple recipients
 * - Delivery and channel tracking (IN_APP / EMAIL / PUSH / SMS / WEBHOOK)
 * - Actionable notifications with deep links
 * - Localization support
 * - Grouping/threading
 * - Tenant (orgNo) scoping
 */

const RecipientSub = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    dismissed: { type: Boolean, default: false },
    dismissedAt: { type: Date },
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    channelStatus: { type: Map, of: Date }, // e.g. { IN_APP: Date, EMAIL: Date }
    metadata: { type: Schema.Types.Mixed }
}, { _id: false });

const translationSchema = new Schema({
    locale: { type: String, required: true },
    title: { type: String },
    message: { type: String }
}, { _id: false });

const notificationSchema = new Schema({
    orgNo: { type: String, index: true }, // tenant id if multi-tenant

    title: { type: String, trim: true, required: true, maxlength: 200 },
    message: { type: String, trim: true, required: true, maxlength: 2000 },

    // type/category of the notification
    type: { type: String, required: true, index: true },

    // priority/severity
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM', index: true },
    severityScore: { type: Number, default: 0 }, // optional numeric score

    // channels to attempt delivering through
    channels: { type: [String], enum: ['IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WEBHOOK'], default: ['IN_APP'] },

    // recipients list (supports broadcast via isBroadcast or recipientRoles)
    recipients: { type: [RecipientSub], default: [] },
    recipient: { type: Schema.Types.ObjectId, ref: 'User' }, // legacy/single-recipient support
    recipientRoles: { type: [String], default: [] },
    isBroadcast: { type: Boolean, default: false },

    // audience filter (optional) - stored as JSON criteria for server-side expansion
    audienceCriteria: { type: Schema.Types.Mixed },

    // related entity for deep links / context
    relatedEntity: {
        entityType: { type: String, enum: ['PRODUCT', 'ORDER', 'SUPPLIER', 'USER', 'CATEGORY', 'PURCHASE_ORDER', 'STOCK', 'WAREHOUSE'] },
        entityId: { type: Schema.Types.ObjectId, refPath: 'relatedEntity.entityType' }
    },

    // action payload (for actionable notifications)
    action: {
        required: { type: Boolean, default: false },
        label: { type: String },
        url: { type: String, trim: true },
        data: { type: Schema.Types.Mixed }
    },

    // delivery tracking and metadata
    delivery: {
        attempts: { type: Number, default: 0 },
        lastAttemptAt: { type: Date },
        channelStatuses: { type: Map, of: String } // e.g. { EMAIL: 'sent'|'failed'|'queued' }
    },

    // optional geo / visual metadata
    metadata: { type: Schema.Types.Mixed },

    // grouping and threading support
    groupId: { type: String, index: true },
    threadId: { type: String },

    // localization
    locale: { type: String },
    translations: { type: [translationSchema], default: [] },

    // scheduling & expiry
    scheduledAt: { type: Date },
    expireAt: { type: Date, index: true },

    // lightweight seen/dismiss counters
    seenCount: { type: Number, default: 0 },
    dismissedCount: { type: Number, default: 0 },

    // other flags
    actionRequired: { type: Boolean, default: false }

}, { timestamps: true });

// Indexes for fast queries
notificationSchema.index({ 'recipients.recipient': 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, createdAt: -1 });
notificationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-remove expired notifications

// Instance helpers
notificationSchema.methods.markAsRead = async function(userId) {
    // support per-recipient read tracking
    if (!userId && this.recipient) {
        this.isRead = true
        this.readAt = new Date()
        return this.save()
    }

    let changed = false
    this.recipients = this.recipients.map(r => {
        if (String(r.recipient) === String(userId) && !r.read) {
            r.read = true
            r.readAt = new Date()
            changed = true
        }
        return r
    })

    if (changed) {
        this.seenCount = (this.seenCount || 0) + 1
        return this.save()
    }
    return this
}

notificationSchema.methods.markAsDeliveredFor = async function(userId, channel) {
    let changed = false
    this.recipients = this.recipients.map(r => {
        if (String(r.recipient) === String(userId)) {
            r.delivered = true
            r.deliveredAt = new Date()
            if (!r.channelStatus) r.channelStatus = new Map()
            r.channelStatus.set(channel, new Date())
            changed = true
        }
        return r
    })
    if (changed) {
        return this.save()
    }
    return this
}

notificationSchema.methods.incrementDeliveryAttempt = function() {
    this.delivery.attempts = (this.delivery.attempts || 0) + 1
    this.delivery.lastAttemptAt = new Date()
    return this.save()
}

notificationSchema.methods.markAsDismissed = async function(userId) {
    let changed = false
    this.recipients = this.recipients.map(r => {
        if (String(r.recipient) === String(userId) && !r.dismissed) {
            r.dismissed = true
            r.dismissedAt = new Date()
            changed = true
        }
        return r
    })
    if (changed) {
        this.dismissedCount = (this.dismissedCount || 0) + 1
        return this.save()
    }
    return this
}

// Static helper to create notification for multiple recipients
notificationSchema.statics.createForRecipients = async function(payload, recipientIds = []) {
    const Notification = this
    const recipients = recipientIds.map(id => ({ recipient: id }))
    const doc = new Notification({ ...payload, recipients })
    return doc.save()
}

// toJSON cleanup
notificationSchema.methods.toJSON = function() {
    const obj = this.toObject({ virtuals: false })
    // remove channelStatuses Map serialisation issues
    if (obj.delivery && obj.delivery.channelStatuses && obj.delivery.channelStatuses instanceof Map) {
        obj.delivery.channelStatuses = Object.fromEntries(obj.delivery.channelStatuses)
    }
    if (obj.recipients && Array.isArray(obj.recipients)) {
        obj.recipients = obj.recipients.map(r => {
            if (r.channelStatus && r.channelStatus instanceof Map) r.channelStatus = Object.fromEntries(r.channelStatus)
            return r
        })
    }
    return obj
}

const NotificationModel = mongoose.model('Notification', notificationSchema);
module.exports = {
    NotificationModel
};