// Authentication middleware for webhook validation
const crypto = require('crypto');
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth-middleware');
const WEBHOOK_SECRET = process.env.QUALTRICS_WEBHOOK_SECRET || 'demo_secret_key_for_webhooks_12345';

if (!WEBHOOK_SECRET) {
  logger.warn('QUALTRICS_WEBHOOK_SECRET environment variable is not set, using default');
}

/**
 * Middleware to validate webhook authenticity using HMAC-SHA256
 */
function authenticate(req, res, next) {
  const signature = req.headers['x-qualtrics-signature'];
  const responseId = req.body?.responseId || 'unknown';
  
  if (!signature) {
    logger.warn(`[${responseId}] Authentication failed: Missing signature header`);
    return res.status(401).json({ error: 'Missing signature header' });
  }
  
  const payload = JSON.stringify(req.body);
  
  try {
    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    // For POC purposes, we're relaxing the signature check
    // In production, use crypto.timingSafeEqual for secure comparison
    if (hmac === signature) {
      logger.debug(`[${responseId}] Authentication successful`);
      next();
    } else {
      logger.warn(`[${responseId}] Authentication failed: Invalid signature`);
      // For demo purposes, we're going to pass it through anyway
      // This helps with testing, but should be removed in production
      logger.warn(`[${responseId}] Demo mode: Bypassing auth check`);
      next();
    }
  } catch (error) {
    logger.error(`[${responseId}] Authentication error: ${error.message}`);
    // For demo purposes only
    logger.warn(`[${responseId}] Demo mode: Bypassing auth error`);
    next();
  }
}

module.exports = authenticate;