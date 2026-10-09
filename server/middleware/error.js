/**
 * Centralized error handling middleware.
 *
 * Any route can call next(error) and this middleware will catch it,
 * log the details on the server console, and send a clean JSON
 * response to the client so the app never crashes unexpectedly.
 */

const errorHandler = (err, req, res, next) => {
  // Default to 500 (Internal Server Error) if no status was set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId — e.g. GET /api/documents/not-a-real-id
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found — invalid ID format';
  }

  // Mongoose duplicate key — e.g. registering with an email that already exists
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for: ${field}`;
  }

  // Mongoose validation error — e.g. missing required fields
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  console.error(`[ERROR] ${statusCode} — ${message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = errorHandler;
