const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./models/database');

// Safe require helper for routes
function requireRoute(pathStr) {
  try {
    const mod = require(pathStr);
    // Check if it's a valid Express router
    if (!mod || !mod.stack) {
      throw new Error(`Route file "${pathStr}" must export an Express router`);
    }
    return mod;
  } catch (err) {
    console.error(`Error loading route "${pathStr}":`, err);
    throw err;
  }
}

// Safe require helper for error handlers
function requireErrorHandler(pathStr) {
  try {
    const mod = require(pathStr);
    if (typeof mod !== 'function' || mod.length !== 4) {
      throw new Error(`Error handler "${pathStr}" must be a function with (err, req, res, next)`);
    }
    return mod;
  } catch (err) {
    console.error(`Error loading error handler "${pathStr}":`, err);
    throw err;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/tasks', require('./routes/tasks'));
} catch (err) {
  console.error('Failed to load routes:', err);
  process.exit(1);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware (must come last before 404 handler)
app.use(require('./middleware/errorHandler'));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Database initialization and server start
async function startServer() {
  try {
    await initializeDatabase();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    // Handle server shutdown gracefully
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;