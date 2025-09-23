const jwt = require('jsonwebtoken'); // Assuming you're using JWT for authentication
const { UserModal } = require('../models/User');

// Middleware to check role-based access
const RoleVerifyMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Retrieve token from cookies or Authorization header
      const token = req?.cookies?.inventory_management_token || req.headers.authorization?.split(' ')[1]; 

      console.log({ token }, 'token');
      
      if (!token) {
        return handleUnauthorized(res);
      }

      // Verify the token and extract user data
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModal.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
      }

      // console.log({ role: user.activerole }, 'decoded user');

      // Handle "all" access or specific role verification
      if (allowedRoles.includes("all") || allowedRoles.includes(user.activerole)) {
        req.profile = user; 
        return next(); 
      }

      
      return res.status(403).json({ status: false, message: 'Forbidden' });
      
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
