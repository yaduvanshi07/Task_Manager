const errorHandler = (err, req, res, next) => {
  // Default error structure
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    type: err.name || 'InternalError',
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err.details 
    })
  };

  // Log the error with more context
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    type: err.name,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : 'anonymous'
  });

  // Handle specific error types
  switch (true) {
    // Mongoose validation errors
    case err.name === 'ValidationError':
      errorResponse.message = 'Validation Failed';
      errorResponse.errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json(errorResponse);

    // JWT errors
    case err.name === 'JsonWebTokenError':
      errorResponse.message = 'Invalid authentication token';
      return res.status(401).json(errorResponse);

    case err.name === 'TokenExpiredError':
      errorResponse.message = 'Authentication token expired';
      return res.status(401).json(errorResponse);

    // Database errors (PostgreSQL)
    case err.code === '23505': // Unique violation
      errorResponse.message = 'Resource already exists';
      errorResponse.field = err.constraint;
      return res.status(409).json(errorResponse);

    case err.code === '23503': // Foreign key violation
      errorResponse.message = 'Related resource not found';
      return res.status(400).json(errorResponse);

    // File upload errors
    case err.code === 'LIMIT_FILE_SIZE':
      errorResponse.message = 'File size exceeds maximum allowed';
      return res.status(413).json(errorResponse);

    case err.code === 'LIMIT_FILE_COUNT':
      errorResponse.message = 'Too many files uploaded';
      return res.status(413).json(errorResponse);

    case err.code === 'LIMIT_UNEXPECTED_FILE':
      errorResponse.message = 'Unexpected file field';
      return res.status(400).json(errorResponse);

    // Custom business logic errors
    case err.isOperational:
      return res.status(err.statusCode || 400).json(errorResponse);

    // Fallback for unhandled errors
    default:
      // Mask internal errors in production
      if (process.env.NODE_ENV === 'production') {
        errorResponse.message = 'Something went wrong';
        delete errorResponse.type;
      }
      return res.status(err.status || 500).json(errorResponse);
  }
};

module.exports = errorHandler;