const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization header missing',
        message: 'Please provide Bearer token in Authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      phoneNumber: decoded.phoneNumber,
      ip: decoded.ip,
      deviceId: decoded.deviceId
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please verify OTP again to get a new token'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or malformed'
      });
    } else {
      return res.status(500).json({
        error: 'Token verification failed',
        message: 'Internal server error during token verification'
      });
    }
  }
};

// Optional middleware to check if user is verified
const requireVerifiedUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide valid authentication token'
    });
  }
  
  // You can add additional checks here if needed
  // For example, check if user exists in database and is verified
  
  next();
};

module.exports = {
  authenticateToken,
  requireVerifiedUser
};
