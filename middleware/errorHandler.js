// Handles requests for routes that don't exist
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Normalizes error responses globally
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log stack trace only in development
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Hide stack traces in production
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};