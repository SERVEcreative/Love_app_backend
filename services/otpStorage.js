class OTPStorage {
  constructor() {
    this.otpStore = new Map(); // phoneNumber -> { otp, timestamp, attempts }
    this.OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes
    this.MAX_ATTEMPTS = 3; // Maximum verification attempts
  }

  // Store OTP for a phone number
  storeOTP(phoneNumber, otp) {
    const timestamp = Date.now();
    this.otpStore.set(phoneNumber, {
      otp: otp,
      timestamp: timestamp,
      attempts: 0
    });

    // Auto-cleanup after expiry
    setTimeout(() => {
      this.otpStore.delete(phoneNumber);
    }, this.OTP_EXPIRY_MINUTES * 60 * 1000);

    console.log(`OTP stored for ${phoneNumber}: ${otp}`);
  }

  // Verify OTP for a phone number
  verifyOTP(phoneNumber, userOTP) {
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
      this.otpStore.delete(phoneNumber);
      return { success: false, message: 'Maximum verification attempts exceeded' };
    }

    // Increment attempts
    storedData.attempts++;

    // Verify OTP
    if (storedData.otp === userOTP) {
      // OTP is correct - remove it from storage
      this.otpStore.delete(phoneNumber);
      return { success: true, message: 'OTP verified successfully' };
    } else {
      return { success: false, message: 'Invalid OTP' };
    }
  }

  // Get stored OTP (for debugging)
  getStoredOTP(phoneNumber) {
    return this.otpStore.get(phoneNumber);
  }

  // Clear all stored OTPs (for testing)
  clearAll() {
    this.otpStore.clear();
  }
}

module.exports = new OTPStorage();
