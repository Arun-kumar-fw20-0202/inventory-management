const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  return jwt.sign({
    userId: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    activerole: user.activerole,
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};
