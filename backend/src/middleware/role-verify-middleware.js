const jwt = require('jsonwebtoken'); // Using JWT for authentication
const crypto = require('crypto');
const { UserModal } = require('../models/User');
const { SessionModel } = require('../models/session/SessionSchema');

// helper to hash token
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// Middleware to check role-based access and validate active session
const RoleVerifyMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Retrieve token from cookies or Authorization header
      const token = req?.cookies?.inventory_management_token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);

      if (!token) {
        return handleUnauthorized(res);
      }

      // Verify the token and extract user data
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return handleUnauthorized(res);
      }

      // Check session existence by token hash and revoked flag
      const tokenHash = hashToken(token);
      let session = await SessionModel.findOne({ tokenHash }).lean();
      if (!session) {
        // try legacy plain token lookup and migrate
        const legacy = await SessionModel.findOne({ token }).lean();
        if (legacy) {
          try {
            await SessionModel.updateOne({ _id: legacy._id }, { $set: { tokenHash, token: undefined } });
            session = await SessionModel.findById(legacy._id).lean();
          } catch (e) {
            console.error('Failed to migrate legacy session token:', e);
          }
        }
      }

      if (!session || session.revoked) return handleUnauthorized(res);

      // check expiry
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        try { await SessionModel.updateOne({ _id: session._id }, { $set: { revoked: true } }); } catch (e) {}
        return handleUnauthorized(res);
      }

      // fetch user
      const user = await UserModal.findById(session.userId);
      if (!user) return res.status(404).json({ status: false, message: 'User not found' });

      if (user?.block_status) {
        await SessionModel.updateOne({ _id: session._id }, { $set: { revoked: true } }).catch(()=>{});
        return res.clearCookie('inventory_management_token').status(403).json({ status: false, message: 'Your account is blocked. Please contact support.' });
      }

      // Handle allowed roles
      if (allowedRoles.includes('all') || allowedRoles.includes(user.activerole)) {
        // Update lastUsedAt non-blocking
        SessionModel.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } }).catch(()=>{});
        req.profile = user;
        req.session = session;
        return next();
      }

      return res.status(403).json({ status: false, message: 'You are not eligible !' });

    } catch (err) {
      console.error(err);
      return res.clearCookie('inventory_management_token').status(401).json({ status: false, message: 'Unauthorized' });
    }
  };
};

// Handle unauthorized response and clear token cookie
const handleUnauthorized = (res) => {
  res.clearCookie('inventory_management_token').status(401).json({ status: false, message: 'Unauthorized' });
};

module.exports = { RoleVerifyMiddleware };
