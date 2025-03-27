// Idempotency middleware to prevent duplicate processing
const { createLogger } = require('../utils/logger');

const logger = createLogger('idempotency-middleware');

/**
 * IMPORTANT: This is a simple in-memory implementation for the POC only.
 * 
 * LIMITATIONS:
 * - Not suitable for production or multi-instance deployments
 * - Data is lost on service restart
 * - Memory usage will grow until cleanup
 * 
 * PRODUCTION RECOMMENDATIONS:
 * - Use Redis, DynamoDB, or another distributed cache/database
 * - Implement proper TTL handling at the storage level
 * - Add monitoring for cache size and hit/miss rates
 */

// In-memory store for processed response IDs
const processedResponses = new Map();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [responseId, timestamp] of processedResponses.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL) {
      processedResponses.delete(responseId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} expired entries from idempotency store`);
  }
}, 60 * 60 * 1000); // Run hourly

/**
 * Middleware to check if a webhook has already been processed
 */
function checkIdempotency(req, res, next) {
  const { responseId } = req.body;
  
  if (!responseId) {
    logger.warn('Idempotency check failed: Missing responseId');
    return res.status(400).json({ error: 'Missing responseId' });
  }
  
  if (processedResponses.has(responseId)) {
    logger.info(`[${responseId}] Duplicate request detected`);
    return res.status(200).json({ status: 'already processed' });
  }
  
  // Mark as processed with current timestamp
  processedResponses.set(responseId, Date.now());
  logger.debug(`[${responseId}] Added to idempotency store`);
  next();
}

// Export for testing and use
module.exports = checkIdempotency;