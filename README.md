# 🔐 WhatsApp OTP Authentication Backend with User Management

A production-ready, secure WhatsApp OTP authentication system with comprehensive user management, built with Node.js, Express, WhatsApp Cloud API, and Supabase.

## 🚀 Features

### ✅ Core Authentication
- **WhatsApp OTP Integration**: Send OTPs via WhatsApp Cloud API
- **Template-based Messaging**: Uses `otp_verification` template
- **JWT Token Generation**: Secure authentication tokens
- **Phone Number Validation**: Comprehensive validation and formatting

### 👤 User Management
- **User Profile System**: Complete user profiles with Supabase integration
- **Profile Completion Tracking**: Automatic profile completion percentage calculation
- **User Preferences**: Customizable app settings and privacy controls
- **User Search & Discovery**: Advanced user search with filters
- **Activity Logging**: Comprehensive user activity tracking
- **User Statistics**: Profile completion and connection statistics

### 🔒 Production-Ready Security Features

#### **1. OTP Security**
- **Cryptographically Secure OTPs**: Uses `crypto.randomInt()` for true randomness
- **Hashed Storage**: OTPs are hashed before storage using SHA-256
- **Timing-Safe Comparison**: Prevents timing attacks during OTP verification
- **Short Expiry**: 5-minute OTP expiry for enhanced security
- **Attempt Limiting**: Maximum 3 verification attempts per OTP

#### **2. Rate Limiting & IP Protection**
- **Multi-level Rate Limiting**: 
  - Global: 100 requests per 15 minutes per IP
  - OTP Requests: 5 requests per 15 minutes per IP
  - Verification: 10 attempts per 15 minutes per IP
- **IP Blocking**: Automatic IP blocking for suspicious activity
- **Rate Limit Windows**: Configurable time windows for different endpoints
- **Retry-After Headers**: Proper HTTP 429 responses with retry information

#### **3. Request Security**
- **Input Validation**: Comprehensive Joi schema validation
- **Request Size Limits**: 1MB limit on request bodies
- **Content-Type Validation**: Strict JSON content type enforcement
- **Suspicious Header Detection**: Blocks malicious headers
- **IP Validation**: Blocks private IP ranges in production

#### **4. Security Headers**
- **Helmet.js Integration**: Comprehensive security headers
- **HSTS**: HTTP Strict Transport Security
- **CSP**: Content Security Policy
- **XSS Protection**: Cross-site scripting protection
- **Frame Guard**: Clickjacking protection

#### **5. Device & Session Security**
- **Device Fingerprinting**: Unique device ID generation
- **IP Tracking**: Tracks and validates client IPs
- **User Agent Validation**: Device consistency checks
- **JWT Security**: Enhanced JWT with issuer, audience, and timestamps

#### **6. Monitoring & Logging**
- **Security Event Logging**: All security events are logged
- **Request Logging**: Comprehensive request/response logging
- **Error Handling**: Production-safe error responses
- **Performance Monitoring**: Request duration tracking

## 📋 Prerequisites

- Node.js 16+ 
- WhatsApp Business API access
- Valid WhatsApp template (`otp_verification`)
- Supabase account and project
- Redis server (optional, for production)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/SERVEcreative/Love_app_backend.git
cd Love_app_backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
```

4. **Configure environment variables**
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
JWT_SECRET=your_very_secure_jwt_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Set up database schema**
```bash
npm run setup-db
```

6. **Start the server**
```bash
npm start
```

## 🔧 API Endpoints

### Authentication Endpoints

#### **POST /api/auth/send-otp**
Send OTP via WhatsApp

**Request:**
```json
{
  "phoneNumber": "+916204691688"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully via WhatsApp",
  "messageId": "wamid.HBgMOTE2MjA0NjkxNjg4FQIAERgS..."
}
```

### **POST /api/auth/verify-otp**
Verify OTP and get JWT token

**Request:**
```json
{
  "phoneNumber": "+916204691688",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "phoneNumber": "916204691688"
  }
}
```

### **GET /health**
Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### User Management Endpoints

#### **GET /api/users/profile**
Get current user profile (requires authentication)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "phone_number": "+916204691688",
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "Software developer",
    "avatar_url": "https://example.com/avatar.jpg",
    "is_verified": true,
    "profile_completion_percentage": 85,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### **PUT /api/users/profile**
Update user profile (requires authentication)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Software developer",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "location": "New York, USA",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### **GET /api/users/search**
Search for users (requires authentication)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?gender=male&minAge=25&maxAge=35&location=New York&sortBy=recent&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "Designer",
      "location": "New York, USA",
      "is_verified": true,
      "profile_completion_percentage": 90
    }
  ],
  "total": 1
}
```

#### **GET /api/users/stats**
Get user statistics (requires authentication)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalConnections": 25,
    "blockedUsers": 3,
    "profileCompletion": 85,
    "loginCount": 15
  }
}
```

## 🔒 Security Configuration

### **Rate Limiting**
```javascript
// Global rate limit: 100 requests per 15 minutes
// OTP requests: 5 per 15 minutes
// Verification: 10 per 15 minutes
```

### **OTP Security**
```javascript
// OTP expiry: 5 minutes
// Max attempts: 3
// IP block duration: 30 minutes (failed attempts)
// IP block duration: 1 hour (rate limit exceeded)
```

### **Request Security**
```javascript
// Request size limit: 1MB
// Content-Type: application/json only
// Private IP blocking: Enabled in production
```

## 🚨 Security Best Practices

### **1. Environment Variables**
- Use strong, unique JWT secrets
- Never commit `.env` files
- Use different secrets for different environments

### **2. Production Deployment**
- Use HTTPS only
- Set `NODE_ENV=production`
- Use proper reverse proxy (nginx)
- Enable firewall rules

### **3. Monitoring**
- Monitor rate limit violations
- Track failed OTP attempts
- Log security events
- Set up alerts for suspicious activity

### **4. WhatsApp API**
- Use approved templates only
- Monitor template delivery rates
- Keep access tokens secure
- Rotate tokens regularly

## 🧪 Testing

### **Test OTP Sending**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+916204691688"}'
```

### **Test OTP Verification**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+916204691688", "otp": "123456"}'
```

## 📊 Security Metrics

The system tracks and logs:
- OTP generation events
- Verification attempts (success/failure)
- Rate limit violations
- IP blocking events
- Device fingerprint mismatches
- Request patterns

## 🔧 Customization

### **Adjusting Security Parameters**
```javascript
// In services/otpStorage.js
this.OTP_EXPIRY_MINUTES = 5; // Change OTP expiry
this.MAX_ATTEMPTS = 3; // Change max attempts
this.RATE_LIMIT_WINDOW = 15 * 60 * 1000; // Change rate limit window
```

### **Adding Custom Validation**
```javascript
// In routes/auth.js - add custom validation
const customValidation = (req, res, next) => {
  // Your custom validation logic
  next();
};
```

## 🚀 Deployment

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### **Environment-Specific Configs**
- **Development**: Full logging, debug mode
- **Staging**: Limited logging, security enabled
- **Production**: Minimal logging, maximum security

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review security best practices

---

**⚠️ Security Notice**: This system implements production-ready security measures. Always review and customize security settings based on your specific requirements and threat model.
