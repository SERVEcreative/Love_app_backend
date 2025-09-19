const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
require("dotenv").config();

// Import security middleware
const {
  otpRateLimit,
  verifyRateLimit,
  securityHeaders,
  validateRequest,
  validateIP,
  requestLogger,
  errorHandler,
} = require("./middleware/security");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const pricingRoutes = require("./routes/pricing");
// No chat routes needed - using Supabase Realtime for calls

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced security middleware
app.use(securityHeaders);
app.use(compression());
app.use(morgan("combined"));

// CORS configuration with enhanced security - Handle Flutter web apps
const allowedOrigins = [
  // Flutter web apps (dynamic ports)
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  // Mobile development
  'http://192.168.1.3:5000',  // Current local IP
  'http://192.168.1.5:5000',  // Previous IP
  'http://192.168.1.7:5000',  // Previous IP
  // External server IP
  'http://152.58.87.130:5000',  // External server IP
  // Environment variable
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        console.log(`🌐 Allowing origin: ${origin}`);
        callback(null, true);
      } else {
        console.log(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["X-Total-Count"],
    maxAge: 86400, // 24 hours
  })
);

// Body parsing middleware with size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Global security middleware
app.use(validateIP);
app.use(validateRequest);
app.use(requestLogger);

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP",
    message: "Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalRateLimit);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes with specific rate limiting
app.use("/api/auth", otpRateLimit, authRoutes);

// Apply verification rate limit specifically to verify endpoint
app.use("/api/auth/verify-otp", verifyRateLimit);

// User management routes
app.use("/api/users", userRoutes);

// Pricing management routes
app.use("/api/pricing", pricingRoutes);

// No chat routes needed - using Supabase Realtime

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WhatsApp OTP Authentication ready`);
  console.log(`📞 Call system ready (Supabase Realtime)`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Network access: http://192.168.1.7:${PORT}/health`);
  console.log(
    `🔒 Security features: Rate limiting, IP blocking, Request validation`
  );
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
