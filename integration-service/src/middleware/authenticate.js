// Authentication middleware for webhook validation
const crypto = require('crypto');
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth-middleware');
const WEBHOOK_SECRET = process.env.QUALTRICS_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  logger.error('QUALTRICS_WEBHOOK_SECRET environment variable is not set');
  process.exit(1);
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
    
    // Use constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(signature, 'hex')
    );
    
    if (isValid) {
      logger.debug(`[${responseId}] Authentication successful`);
      next();
    } else {
      logger.warn(`[${responseId}] Authentication failed: Invalid signature`);
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    logger.error(`[${responseId}] Authentication error: ${error.message}`);
    return res.status(401).json({ error: 'Authentication error' });
  }
}

module.exports = authenticate;