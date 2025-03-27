// Error handling middleware
const { createLogger } = require('./logger');

const logger = createLogger('error-handler');

/**
 * Express error handling middleware
 */
function errorHandler(err, req, res, next) {
  const responseId = req.body?.responseId || 'unknown';
  const statusCode = err.statusCode || 500;
  
  // Log the error
  logger.error(`[${responseId}] ${err.message}`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Send appropriate response
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
    requestId: responseId
  });
}

module.exports = errorHandler;