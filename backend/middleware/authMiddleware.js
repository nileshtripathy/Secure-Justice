const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the Bearer token, then loads the user so that deleted / unapproved
 * accounts and role changes take effect immediately (not only after token expiry).
 */
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email role status');
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Not authorized, account unavailable' });
    }
    req.user = { id: user._id.toString(), role: user.role, name: user.name };
    return next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`,
    });
  }
  return next();
};

module.exports = { protect, authorize };
