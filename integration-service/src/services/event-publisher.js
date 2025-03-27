// Mock New Relic event publishing service
// This is a simplified version without the actual telemetry SDK dependency
const { createLogger } = require('../utils/logger');

const logger = createLogger('event-publisher');
const INSERT_KEY = process.env.NEW_RELIC_INSERT_KEY || 'mock_insert_key';

if (!INSERT_KEY) {
  logger.warn('NEW_RELIC_INSERT_KEY environment variable is not set, using mock key');
}

/**
 * Middleware to publish events to New Relic (mocked for POC)
 */
function publishEvent(req, res) {
  const { npsEvent } = req;
  const responseId = npsEvent.qualtricsResponseId;
  
  logger.debug(`[${responseId}] Sending event to New Relic (mock):`, JSON.stringify(npsEvent));
  
  // In a real environment, we would send the event to New Relic
  // For this POC, we're just logging the event
  
  // Simulate async API call
  setTimeout(() => {
    logger.info(`[${responseId}] Event sent successfully to New Relic (mock)`);
  }, 100);
  
  // Respond with 200 OK since we've already processed the event
  res.status(200).json({ status: 'processed' });
}

module.exports = publishEvent;