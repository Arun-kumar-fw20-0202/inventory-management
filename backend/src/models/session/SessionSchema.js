const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // store hashed token, not plaintext
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // optional refresh token hash (if you use a separate refresh token)
  refreshTokenHash: { type: String },

  userAgent: { type: String }, // device/browser info
  deviceId: { type: String }, // optional device identifier or fingerprint
  ipAddress: { type: String },

  // auditing
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },

  // expiration handled by TTL index on expiresAt
  expiresAt: { type: Date, required: true },

  revoked: { type: Boolean, default: false }, // support revoked sessions
  replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },

  orgNo: { type: String, required: true },
  
  // optional metadata
  meta: { type: mongoose.Schema.Types.Mixed },

  sessionType: { type: String, enum: ['access','refresh','session'], default: 'session' }
}, {
  timestamps: true
});

// TTL index for automatic deletion
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// optional: if you want to enforce single active session per user (careful)
// SessionSchema.index({ userId: 1 }, { unique: true });

const SessionModel = mongoose.model('Session', SessionSchema);
module.exports = {
    SessionModel
}