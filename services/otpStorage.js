const crypto = require('crypto');

class SecureOTPStorage {
  constructor() {
    this.otpStore = new Map(); // phoneNumber -> { otp, timestamp, attempts, ipAddress, deviceId }
    this.rateLimitStore = new Map(); // phoneNumber -> { lastRequestTime, requestCount }
    this.blockedIPs = new Map(); // ipAddress -> { blockedUntil, reason }
    
    // Security configurations
    this.OTP_EXPIRY_MINUTES = 5; // Reduced from 10 to 5 minutes for security
    this.MAX_ATTEMPTS = 3; // Maximum verification attempts
    this.RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
    this.MAX_REQUESTS_PER_WINDOW = 3; // Max OTP requests per 15 minutes
    this.BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes block for excessive attempts
    this.IP_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour block for suspicious IPs
    
    // Cleanup intervals
    this.startCleanupScheduler();
  }

  // Generate cryptographically secure OTP
  generateSecureOTP() {
    // Use crypto.randomInt for cryptographically secure random numbers
    const min = 100000;
    const max = 999999;
    return crypto.randomInt(min, max + 1).toString();
  }

  // Generate device fingerprint
  generateDeviceId(userAgent, ipAddress) {
    const data = `${userAgent}-${ipAddress}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // Check if IP is blocked
  isIPBlocked(ipAddress) {
    const blockedData = this.blockedIPs.get(ipAddress);
    if (blockedData && Date.now() < blockedData.blockedUntil) {
      return { blocked: true, reason: blockedData.reason, remainingTime: blockedData.blockedUntil - Date.now() };
    }
    
    // Clean up expired blocks
    if (blockedData) {
      this.blockedIPs.delete(ipAddress);
    }
    
    return { blocked: false };
  }

  // Check rate limiting
  checkRateLimit(phoneNumber, ipAddress) {
    const now = Date.now();
    const rateLimitData = this.rateLimitStore.get(phoneNumber);
    
    if (!rateLimitData) {
      this.rateLimitStore.set(phoneNumber, {
        lastRequestTime: now,
        requestCount: 1,
        ipAddress: ipAddress
      });
      return { allowed: true };
    }

    // Check if it's a new window
    if (now - rateLimitData.lastRequestTime > this.RATE_LIMIT_WINDOW) {
      this.rateLimitStore.set(phoneNumber, {
        lastRequestTime: now,
        requestCount: 1,
        ipAddress: ipAddress
      });
      return { allowed: true };
    }

    // Check request count
    if (rateLimitData.requestCount >= this.MAX_REQUESTS_PER_WINDOW) {
      // Block IP for excessive requests
      this.blockedIPs.set(ipAddress, {
        blockedUntil: now + this.IP_BLOCK_DURATION,
        reason: 'Rate limit exceeded'
      });
      
      return { 
        allowed: false, 
        reason: 'Rate limit exceeded. Too many OTP requests.',
        remainingTime: this.IP_BLOCK_DURATION
      };
    }

    // Increment request count
    rateLimitData.requestCount++;
    return { allowed: true };
  }

  // Store OTP with enhanced security
  storeOTP(phoneNumber, ipAddress, userAgent) {
    const now = Date.now();
    const otp = this.generateSecureOTP();
    const deviceId = this.generateDeviceId(userAgent, ipAddress);
    
    // Hash the OTP before storing (additional security layer)
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    
    this.otpStore.set(phoneNumber, {
      hashedOTP: hashedOTP,
      timestamp: now,
      attempts: 0,
      ipAddress: ipAddress,
      deviceId: deviceId,
      userAgent: userAgent
    });

    // Auto-cleanup after expiry
    setTimeout(() => {
      const storedData = this.otpStore.get(phoneNumber);
      if (storedData && storedData.timestamp === now) {
        this.otpStore.delete(phoneNumber);
      }
    }, this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Log security event (in production, use proper logging service)
    console.log(`[SECURITY] OTP generated for ${phoneNumber} from IP: ${ipAddress}`);
    
    return otp; // Return plain OTP for sending via WhatsApp
  }

  // Verify OTP with enhanced security
  verifyOTP(phoneNumber, userOTP, ipAddress, userAgent) {
    const storedData = this.otpStore.get(phoneNumber);
    
    if (!storedData) {
      return { success: false, message: 'OTP not found or expired' };
    }

    // Check if OTP is expired
    const now = Date.now();
    const expiryTime = storedData.timestamp + (this.OTP_EXPIRY_MINUTES * 60 * 1000);
    
    if (now > expiryTime) {
      this.otpStore.delete(phoneNumber);
      return { success: false, message: 'OTP has expired' };
    }

    // Check attempts limit
    if (storedData.attempts >= this.MAX_ATTEMPTS) {
      // Block IP for excessive failed attempts
      this.blockedIPs.set(ipAddress, {
        blockedUntil: now + this.BLOCK_DURATION,
        reason: 'Maximum verification attempts exceeded'
      });
      
      this.otpStore.delete(phoneNumber);
      return { 
        success: false, 
        message: 'Maximum verification attempts exceeded. IP blocked temporarily.',
        blocked: true,
        remainingTime: this.BLOCK_DURATION
      };
    }

    // Verify device consistency (optional security check)
    const currentDeviceId = this.generateDeviceId(userAgent, ipAddress);
    if (storedData.deviceId !== currentDeviceId) {
      console.log(`[SECURITY] Device mismatch for ${phoneNumber}. Expected: ${storedData.deviceId}, Got: ${currentDeviceId}`);
      // Don't block for device mismatch, but log it
    }

    // Increment attempts
    storedData.attempts++;

    // Hash the user-provided OTP for comparison
    const hashedUserOTP = crypto.createHash('sha256').update(userOTP).digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    if (crypto.timingSafeEqual(Buffer.from(hashedUserOTP), Buffer.from(storedData.hashedOTP))) {
      // OTP is correct - remove it from storage
      this.otpStore.delete(phoneNumber);
      
      // Log successful verification
      console.log(`[SECURITY] OTP verified successfully for ${phoneNumber} from IP: ${ipAddress}`);
      
      return { success: true, message: 'OTP verified successfully' };
    } else {
      // Log failed attempt
      console.log(`[SECURITY] Failed OTP attempt for ${phoneNumber} from IP: ${ipAddress}. Attempt: ${storedData.attempts}`);
      
      return { success: false, message: 'Invalid OTP' };
    }
  }

  // Get stored OTP info (for debugging - remove in production)
  getStoredOTP(phoneNumber) {
    const data = this.otpStore.get(phoneNumber);
    if (data) {
      return {
        timestamp: data.timestamp,
        attempts: data.attempts,
        ipAddress: data.ipAddress,
        deviceId: data.deviceId,
        hasOTP: !!data.hashedOTP
      };
    }
    return null;
  }

  // Clear all stored data (for testing)
  clearAll() {
    this.otpStore.clear();
    this.rateLimitStore.clear();
    this.blockedIPs.clear();
  }

  // Get rate limit info
  getRateLimitInfo(phoneNumber) {
    return this.rateLimitStore.get(phoneNumber);
  }

  // Get blocked IP info
  getBlockedIPInfo(ipAddress) {
    return this.blockedIPs.get(ipAddress);
  }

  // Cleanup expired data periodically
  startCleanupScheduler() {
    setInterval(() => {
      const now = Date.now();
      
      // Cleanup expired OTPs
      for (const [phoneNumber, data] of this.otpStore.entries()) {
        const expiryTime = data.timestamp + (this.OTP_EXPIRY_MINUTES * 60 * 1000);
        if (now > expiryTime) {
          this.otpStore.delete(phoneNumber);
        }
      }
      
      // Cleanup expired rate limits
      for (const [phoneNumber, data] of this.rateLimitStore.entries()) {
        if (now - data.lastRequestTime > this.RATE_LIMIT_WINDOW) {
          this.rateLimitStore.delete(phoneNumber);
        }
      }
      
      // Cleanup expired IP blocks
      for (const [ipAddress, data] of this.blockedIPs.entries()) {
        if (now > data.blockedUntil) {
          this.blockedIPs.delete(ipAddress);
        }
      }
    }, 5 * 60 * 1000); // Run cleanup every 5 minutes
  }
}

module.exports = new SecureOTPStorage();
