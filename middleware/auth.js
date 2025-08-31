const jwt = require('jsonwebtoken');
const otpStorage = require('../services/otpStorage');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
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

    // Check if token is blacklisted (DISABLED FOR NOW)
    // try {
    //   const isBlacklisted = otpStorage.isTokenBlacklisted(token);
    //   if (isBlacklisted) {
    //     return res.status(401).json({
    //       error: 'Token invalidated',
    //       message: 'This token has been logged out. Please login again.'
    //     });
    //   }
    // } catch (blacklistError) {
    //   console.error('Error checking token blacklist:', blacklistError);
    //   // Continue with validation even if blacklist check fails
    // }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const { supabaseAdmin } = require('../config/supabase');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, phone_number, is_active, status')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account does not exist'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }

    // Add user info to request object
    req.user = {
      userId: user.id,
      phoneNumber: user.phone_number,
      status: user.status,
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
      console.error('Authentication error:', error);
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
