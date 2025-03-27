// Simplified authentication middleware for POC
const { createLogger } = require('../utils/logger');
const logger = createLogger('auth-middleware');

/**
 * Simplified authentication middleware for POC
 * In a real implementation, this would verify webhook signatures
 */
function authenticate(req, res, next) {
  const responseId = req.body?.responseId || 'unknown';
  logger.debug(`[${responseId}] POC mode: Authentication bypassed`);
  next();
}

module.exports = authenticate;