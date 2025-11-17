// Suppress punycode deprecation warning
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return; // Suppress punycode deprecation warnings
  }
  console.warn(warning.name, warning.message);
});

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { syncAllData } = require('./services/dataSyncService');
const { refreshKnowledgeBase } = require('./services/ragService');

// Load env vars
dotenv.config();

// Support legacy MONGO_URI env variable names
if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
  process.env.MONGODB_URI = process.env.MONGO_URI;
}

// Ensure required environment variables are set
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please set these variables in your .env file or environment configuration.');
  process.exit(1);
}

// Connect to database
connectDB();

// Initialize data exports and knowledge base asynchronously
(async () => {
  try {
    await syncAllData();
    await refreshKnowledgeBase();
  } catch (error) {
    console.error('⚠️  Failed to initialize knowledge base:', error.message);
  }
})();

// Route files
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/uploads', express.static('public/uploads'));

// Enable CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OmniCart API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

// Function to find available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = require('http').createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
};

// Start server with port conflict handling
const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    const server = app.listen(availablePort, () => {
      console.log(`
╔════════════════════════════════════════╗
║     OmniCart Backend API Server        ║
║                                        ║
║  Status: Running                       ║
║  Port: ${availablePort}                          ║
║  Environment: ${process.env.NODE_ENV || 'development'}          ║
║                                        ║
║  API Endpoints:                        ║
║  - Auth: /api/auth                     ║
║  - Users: /api/users                   ║
║  - Shops: /api/shops                   ║
║  - Products: /api/products             ║
║  - Orders: /api/orders                 ║
║                                        ║
║  Static Files:                         ║
║  - Uploads: /uploads                   ║
║                                        ║
║  CORS Enabled For:                     ║
║  - http://localhost:3000               ║
║  - http://localhost:5000               ║
╚════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${availablePort} is in use, trying next available port...`);
        startServer();
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // In case server is not initialized due to dynamic startup, exit directly
  process.exit(1);
});

module.exports = app;

