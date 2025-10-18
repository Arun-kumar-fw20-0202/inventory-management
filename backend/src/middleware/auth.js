const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { SessionModel } = require('../models/session/SessionSchema');
const { UserModal } = require('../models/User');

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Accept token from cookie or Authorization header
    const token = req.cookies?.inventory_management_token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    // Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Check session exists and not revoked
    const tokenHash = hashToken(token);
    let session = await SessionModel.findOne({ tokenHash }).lean();

    // Migration: if no session found by tokenHash, check legacy plaintext token field and migrate
    if (!session) {
      // find by plain `token` field (legacy) and migrate to tokenHash
      const legacy = await SessionModel.findOne({ token: token }).lean();
      if (legacy) {
        try {
          await SessionModel.updateOne({ _id: legacy._id }, { $set: { tokenHash, token: undefined } });
          session = await SessionModel.findById(legacy._id).lean();
        } catch (e) {
          console.error('Failed to migrate legacy session token:', e);
        }
      }
    }

    if (!session || session.revoked) return res.status(401).json({ success: false, message: 'Session not found or revoked' });

    // Optionally check session expiry (TTL index will cleanup but extra safety)
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      // mark revoked
      try { await SessionModel.updateOne({ _id: session._id }, { $set: { revoked: true } }); } catch (e) {}
      return res.status(401).json({ success: false, message: 'Session expired' });
    }

    // Attach user profile to request
    const user = await UserModal.findById(session.userId).lean();
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

  // update lastUsedAt in a non-blocking way
  try { SessionModel.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } }).catch(()=>{}); } catch(e){}

  req.profile = user;
  req.session = session;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ success: false, message: 'Internal auth error' });
  }
};
