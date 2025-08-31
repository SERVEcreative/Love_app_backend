const axios = require('axios');
const otpStorage = require('./otpStorage');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = 'https://graph.facebook.com/v22.0';
  }

  // Send OTP message via WhatsApp using template
  // async sendOTP(phoneNumber, ipAddress, userAgent) {
  //   try {
  //     // Format phone number
  //     const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
  //     // Check if IP is blocked
  //     const ipBlockCheck = otpStorage.isIPBlocked(ipAddress);
  //     if (ipBlockCheck.blocked) {
  //       throw new Error(`IP blocked: ${ipBlockCheck.reason}. Try again in ${Math.ceil(ipBlockCheck.remainingTime / 60000)} minutes.`);
  //     }
      
  //     // Check rate limiting
  //     const rateLimitCheck = otpStorage.checkRateLimit(formattedPhone, ipAddress);
  //     if (!rateLimitCheck.allowed) {
  //       throw new Error(rateLimitCheck.reason);
  //     }
      
  //     // Generate and store OTP securely
  //     const otp = otpStorage.storeOTP(formattedPhone, ipAddress, userAgent);

  //     const messageData = {
  //       messaging_product: 'whatsapp',
  //       to: formattedPhone,
  //       type: 'template',
  //       template: {
  //         name: 'hello_world',
  //         language: {
  //           code: 'en_US'
  //         },
  //         components: [
  //           {
  //             type: 'body',
  //             parameters: [
  //               {
  //                 type: 'text',
  //                 text: otp
  //               }
  //             ]
  //           },
  //           {
  //             type: 'button',
  //             sub_type: 'url',
  //             index: 0,
  //             parameters: [
  //               {
  //                 type: 'text',
  //                 text: otp
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     };

  //     const response = await axios.post(
  //       `${this.baseUrl}/${this.phoneNumberId}/messages`,
  //       messageData,
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${this.accessToken}`,
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );

  //     console.log('WhatsApp OTP sent successfully:', response.data);
      
  //     return {
  //       success: true,
  //       messageId: response.data.messages[0].id,
  //       message: 'OTP sent successfully'
  //     };
  //   } catch (error) {
  //     console.error('Error sending WhatsApp OTP:', error.response?.data || error.message);
      
  //     // Handle specific security errors
  //     if (error.message.includes('IP blocked') || error.message.includes('Rate limit')) {
  //       throw new Error(error.message);
  //     }
      
  //     throw new Error('Failed to send OTP via WhatsApp');
  //   }
  // }


  //it is working beacuse templase is not verified
  async sendOTP(phoneNumber, ipAddress, userAgent) {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Check if IP is blocked
      const ipBlockCheck = otpStorage.isIPBlocked(ipAddress);
      if (ipBlockCheck.blocked) {
        throw new Error(`IP blocked: ${ipBlockCheck.reason}. Try again in ${Math.ceil(ipBlockCheck.remainingTime / 60000)} minutes.`);
      }
      
      // Check rate limiting
      const rateLimitCheck = otpStorage.checkRateLimit(formattedPhone, ipAddress);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.reason);
      }
      
      // Generate and store OTP securely
      const otp = otpStorage.storeOTP(formattedPhone, ipAddress, userAgent);

      // 🚨 DEBUG: Print OTP in console for manual entry
      console.log('='.repeat(50));
      console.log('🔐 DEBUG OTP FOR MANUAL ENTRY:');
      console.log(`📱 Phone: ${phoneNumber} (${formattedPhone})`);
      console.log(`🔢 OTP: ${otp}`);
      console.log(`⏰ Generated at: ${new Date().toISOString()}`);
      console.log('='.repeat(50));

      return {
        success: true,
        messageId: 'debug_mode',
        message: 'OTP generated successfully (debug mode)',
        debugOTP: otp // Only for development - remove in production
      };
    } catch (error) {
      console.error('Error sending WhatsApp OTP:', error.response?.data || error.message);
      
      // Handle specific security errors
      if (error.message.includes('IP blocked') || error.message.includes('Rate limit')) {
        throw new Error(error.message);
      }
      
      throw new Error('Failed to send OTP via WhatsApp');
    }
  }

  // Format phone number for WhatsApp API
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number doesn't start with country code, add default (assuming +91 for India)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  // Check if phone number is valid
  isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

module.exports = new WhatsAppService();