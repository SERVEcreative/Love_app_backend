const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const whatsappService = require('../services/whatsappService');
const otpStorage = require('../services/otpStorage');

const router = express.Router();

// Enhanced validation schemas
const sendOTPSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
});

const verifyOTPSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required()
});

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip || 
         'unknown';
};

// Helper function to get user agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

// Send OTP via WhatsApp
router.post('/send-otp', async (req, res) => {
  try {
    // Get client information for security
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    // Validate request body
    const { error, value } = sendOTPSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { phoneNumber } = value;

    // Check if phone number is valid
    if (!whatsappService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid phone number format'
      });
    }

    // Send OTP via WhatsApp with security checks
    const result = await whatsappService.sendOTP(phoneNumber, clientIP, userAgent);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        messageId: result.messageId
        // OTP is not returned in response for security
      });
    } else {
      res.status(500).json({
        error: 'Failed to send OTP'
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    
    // Handle security-related errors
    if (error.message.includes('IP blocked') || error.message.includes('Rate limit')) {
      return res.status(429).json({
        error: 'Too many requests',
        message: error.message,
        retryAfter: error.message.includes('minutes') ? 
          parseInt(error.message.match(/(\d+)/)[1]) * 60 : 900 // 15 minutes default
      });
    }
    
    // Handle specific WhatsApp API errors
    if (error.message.includes('Failed to send OTP via WhatsApp')) {
      return res.status(500).json({
        error: 'WhatsApp template error',
        message: 'There was an issue with the WhatsApp template. Please check template configuration.',
        details: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    // Get client information for security
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    // Validate request body
    const { error, value } = verifyOTPSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { phoneNumber, otp } = value;

    // Check if phone number is valid
    if (!whatsappService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid phone number format'
      });
    }

    // Format phone number for verification
    const formattedPhone = whatsappService.formatPhoneNumber(phoneNumber);

    // Check if IP is blocked
    const ipBlockCheck = otpStorage.isIPBlocked(clientIP);
    if (ipBlockCheck.blocked) {
      return res.status(429).json({
        error: 'IP blocked',
        message: ipBlockCheck.reason,
        retryAfter: Math.ceil(ipBlockCheck.remainingTime / 1000)
      });
    }

    // Verify OTP with enhanced security
    const result = otpStorage.verifyOTP(formattedPhone, otp, clientIP, userAgent);
    
    if (result.success) {
      // Generate JWT token with enhanced security (fixed - removed conflicting exp property)
      const token = jwt.sign(
        { 
          phoneNumber: formattedPhone,
          ip: clientIP,
          deviceId: otpStorage.generateDeviceId(userAgent, clientIP),
          iat: Math.floor(Date.now() / 1000)
          // Removed 'exp' property - expiresIn option handles it
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: '24h',
          issuer: 'whatsapp-otp-auth',
          audience: 'mobile-app'
        }
      );

      res.status(200).json({
        success: true,
        message: result.message,
        token: token,
        user: {
          phoneNumber: formattedPhone
        }
      });
    } else {
      // Handle blocked IP after failed attempts
      if (result.blocked) {
        return res.status(429).json({
          success: false,
          error: result.message,
          retryAfter: Math.ceil(result.remainingTime / 1000)
        });
      }
      
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Security status endpoint (for debugging - remove in production)
router.get('/security-status/:phoneNumber', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const clientIP = getClientIP(req);
    
    const otpInfo = otpStorage.getStoredOTP(phoneNumber);
    const rateLimitInfo = otpStorage.getRateLimitInfo(phoneNumber);
    const ipBlockInfo = otpStorage.getBlockedIPInfo(clientIP);
    
    res.json({
      phoneNumber,
      otpInfo,
      rateLimitInfo,
      ipBlockInfo
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;