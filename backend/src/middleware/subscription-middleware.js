const jwt = require('jsonwebtoken'); // Assuming you're using JWT for authentication
const { OrganizationModal } = require('../models/User');

// Helper for unauthorized
function handleUnauthorized(res, msg = 'Unauthorized') {
  return res.status(401).json({ status: false, message: msg });
}

// Middleware to check role-based access
const subscriptionChecker = () => {
    return async (req, res, next) => {
        try {
            // 1. Get token from cookie or header
            const token = req.cookies?.inventory_management_token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
            if (!token) return handleUnauthorized(res, 'No token provided');
    
            // 2. Verify token
            let decoded;
            try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                return handleUnauthorized(res, 'Invalid or expired token');
            }
    
            // 3. Fetch user and payment info
            const user = await OrganizationModal.findById(decoded.userId).select('payment name email');
            if (!user) return res.status(404).json({ status: false, message: 'User not found' });
    
            // 4. Check subscription expiry
            const willExpire = user.payment?.willExpire;
            if (!willExpire) {
                return res.status(403).json({ status: false, message: 'No active subscription found' });
            }
            const now = new Date();
            const expiry = new Date(willExpire);
            if (now > expiry) {
                return res.status(403).json({ status: false, message: 'Your subscription has expired. Please renew to continue.' });
            }
    
            // 5. Attach user info to request for downstream use
            req.payment = {
                id: decoded.userId,
                name: user.name,
                email: user.email,
                payment: user.payment
            };
    
            next();
        } catch (err) {
            console.error('Subscription middleware error:', err);
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    };
};


module.exports = { subscriptionChecker };
