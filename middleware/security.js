const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting for OTP endpoints
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many OTP requests from this IP',
    message: 'Please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 900
    });
  }
});

// Rate limiting for verification endpoints
const verifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 verification attempts per windowMs
  message: {
    error: 'Too many verification attempts from this IP',
    message: 'Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many verification attempts',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 900
    });
  }
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  frameguard: { action: 'deny' }
});

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
  for (const header of suspiciousHeaders) {
    if (req.headers[header]) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Suspicious headers detected'
      });
    }
  }

  // Check content type for POST requests
  if (req.method === 'POST' && req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({
      error: 'Invalid content type',
      message: 'Content-Type must be application/json'
    });
  }

  // Check request size
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 1024 * 1024) { // 1MB limit
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request body exceeds 1MB limit'
    });
  }

  next();
};

// IP validation middleware
const validateIP = (req, res, next) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress || 
                   req.ip || 
                   'unknown';

  // Block private IP ranges (for production)
  if (process.env.NODE_ENV === 'production') {
    const privateIPRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./
    ];

    for (const range of privateIPRanges) {
      if (range.test(clientIP)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Private IP addresses are not allowed'
        });
      }
    }
  }

  // Store validated IP for later use
  req.validatedIP = clientIP;
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const clientIP = req.validatedIP || req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${clientIP} - UA: ${userAgent}`);

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: err.stack
  });
};

module.exports = {
  otpRateLimit,
  verifyRateLimit,
  securityHeaders,
  validateRequest,
  validateIP,
  requestLogger,
  errorHandler
};
