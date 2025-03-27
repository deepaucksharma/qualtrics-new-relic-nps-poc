// Real New Relic event publishing service using New Relic API
const https = require('https');
const { createLogger } = require('../utils/logger');

const logger = createLogger('event-publisher');
const INSERT_KEY = process.env.NEW_RELIC_INSERT_KEY;
const ACCOUNT_ID = process.env.NEW_RELIC_ACCOUNT_ID || '4430445';
const EVENT_API_URL = `https://insights-collector.newrelic.com/v1/accounts/${ACCOUNT_ID}/events`;

// Check if INSERT_KEY is present
if (!INSERT_KEY) {
  logger.error('NEW_RELIC_INSERT_KEY environment variable is required');
  process.exit(1);
}

// Validate INSERT_KEY format
if (INSERT_KEY.startsWith('NRAK-')) {
  logger.warn('Warning: Using a User Key (NRAK-) for data insertion might not work. Insert keys typically start with NRII-');
} else if (!INSERT_KEY.match(/^[A-Za-z0-9\-_]{16,}$/)) {
  logger.warn('Warning: INSERT_KEY format looks unusual, might cause authentication issues');
}

logger.info(`Configured to send events to New Relic account ${ACCOUNT_ID}`);

/**
 * Middleware to publish events to New Relic using Events API
 */
function publishEvent(req, res) {
  const { npsEvent } = req;
  const responseId = npsEvent.qualtricsResponseId;
  
  // Real mode - send to New Relic
  logger.debug(`[${responseId}] Sending event to New Relic:`, JSON.stringify(npsEvent));
  
  // Add proper event type and format for New Relic Events API
  const event = {
    eventType: npsEvent.eventType || 'NpsResponsePoc',
    ...npsEvent
  };
  
  // Send the event to New Relic using https module
  const postData = JSON.stringify([event]);
  logger.debug(`[${responseId}] Sending payload to New Relic: ${postData}`);
  
  const options = {
    hostname: 'insights-collector.newrelic.com',
    path: `/v1/accounts/${ACCOUNT_ID}/events`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Api-Key': INSERT_KEY
    }
  };
  
  const httpRequest = https.request(options, (nrResponse) => {
    let responseData = '';
    
    nrResponse.on('data', (chunk) => {
      responseData += chunk;
    });
    
    nrResponse.on('end', () => {
      if (nrResponse.statusCode >= 200 && nrResponse.statusCode < 300) {
        logger.info(`[${responseId}] Event sent successfully to New Relic`);
        res.status(200).json({ 
          status: 'processed', 
          mode: 'real',
          nrStatus: nrResponse.statusCode,
          nrResponse: responseData 
        });
      } else {
        // Provide more helpful error messages based on status code
        let errorDetail = '';
        if (nrResponse.statusCode === 403) {
          errorDetail = 'Authorization failed. Your INSERT_KEY may not have permission to write to this account or may be invalid.';
          logger.error(`[${responseId}] New Relic API authorization failed (403). The INSERT_KEY (${INSERT_KEY.substring(0, 8)}...) may be invalid or lack permissions.`);
        } else if (nrResponse.statusCode === 404) {
          errorDetail = `Account ID ${ACCOUNT_ID} not found or you don't have access to it.`;
          logger.error(`[${responseId}] New Relic API returned 404 - Account ID ${ACCOUNT_ID} may be incorrect or inaccessible.`);
        } else if (nrResponse.statusCode === 400) {
          errorDetail = 'Bad request. The event payload may be malformed.';
          logger.error(`[${responseId}] New Relic API returned 400 - Bad request. Payload may be malformed: ${postData}`);
        } else {
          errorDetail = `Unexpected error from New Relic API.`;
          logger.error(`[${responseId}] New Relic API responded with status: ${nrResponse.statusCode}, body: ${responseData}`);
        }
        
        res.status(200).json({ 
          status: 'processed_with_errors',
          error: `New Relic API error: ${nrResponse.statusCode}`,
          errorDetail: errorDetail,
          response: responseData,
          mode: 'real'
        });
      }
    });
  });
  
  httpRequest.on('error', (error) => {
    logger.error(`[${responseId}] Error sending event to New Relic: ${error.message}`);
    res.status(200).json({ 
      status: 'processed_with_errors',
      error: error.message,
      mode: 'real'
    });
  });
  
  // Write data to request body
  httpRequest.write(postData);
  httpRequest.end();
}

module.exports = publishEvent;