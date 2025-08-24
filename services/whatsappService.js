const axios = require('axios');
const otpStorage = require('./otpStorage');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = 'https://graph.facebook.com/v22.0';
  }

  // Generate a random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }



  // Send OTP message via WhatsApp using template
  async sendOTP(phoneNumber) {
    try {
      // Generate a 6-digit OTP
      const otp = this.generateOTP();
      
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const messageData = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'otp_verification',
          language: {
            code: 'en_US'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [
                {
                  type: 'text',
                  text:  otp
                }
              ]
             }
          ]
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp OTP sent successfully:', response.data);
      
      // Store OTP for verification
      otpStorage.storeOTP(formattedPhone, otp);
      
      return { 
        success: true, 
        messageId: response.data.messages[0].id,
        otp: otp // Return the OTP for verification (in production, don't return this)
      };
    } catch (error) {
      console.error('Error sending WhatsApp OTP:', error.response?.data || error.message);
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