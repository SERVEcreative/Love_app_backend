const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const whatsappService = require('../services/whatsappService');
const otpStorage = require('../services/otpStorage');

const router = express.Router();

// Validation schemas
const sendOTPSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
});

const verifyOTPSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required()
});

// Send OTP via WhatsApp
router.post('/send-otp', async (req, res) => {
  try {
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

    // Send OTP via WhatsApp
    const result = await whatsappService.sendOTP(phoneNumber);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        messageId: result.messageId,
        otp: result.otp // In production, don't return OTP in response
      });
    } else {
      res.status(500).json({
        error: 'Failed to send OTP'
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    
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

    // Verify OTP
    const result = otpStorage.verifyOTP(formattedPhone, otp);
    
    if (result.success) {
      // Generate JWT token for authenticated user
      const token = jwt.sign(
        { phoneNumber: formattedPhone },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
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

module.exports = router;