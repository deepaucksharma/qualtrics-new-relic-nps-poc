// NPS business logic service
const { createLogger } = require('../utils/logger');

const logger = createLogger('nps-processor');

/**
 * Processes NPS data, calculates category, and prepares event payload
 */
function processNps(req, res, next) {
  // Use extracted data from validation middleware
  const { 
    responseId, userId, sessionId, comment, surveySource, responseTimestamp 
  } = req.extractedData || {};
  const npsScore = req.npsScore;
  
  try {
    // Calculate NPS category
    let npsCategory;
    if (npsScore >= 9) {
      npsCategory = 'Promoter';
    } else if (npsScore >= 7) {
      npsCategory = 'Passive';
    } else {
      npsCategory = 'Detractor';
    }
    
    logger.debug(`[${responseId}] Calculated NPS category: ${npsCategory}`);
    
    // Handle timestamps
    const receivedTimestamp = Date.now();
    let finalResponseTimestamp = receivedTimestamp;
    
    if (responseTimestamp) {
      // Try to parse the input timestamp
      const parsedTimestamp = Number(responseTimestamp);
      if (!isNaN(parsedTimestamp)) {
        // If it's a valid number, use it
        finalResponseTimestamp = parsedTimestamp;
      } else if (typeof responseTimestamp === 'string') {
        // Try to parse as ISO string
        try {
          finalResponseTimestamp = new Date(responseTimestamp).getTime();
          if (isNaN(finalResponseTimestamp)) {
            // If parsing failed, fall back to receivedTimestamp
            finalResponseTimestamp = receivedTimestamp;
            logger.warn(`[${responseId}] Invalid responseTimestamp format, using current time`);
          }
        } catch (e) {
          finalResponseTimestamp = receivedTimestamp;
          logger.warn(`[${responseId}] Error parsing responseTimestamp, using current time: ${e.message}`);
        }
      }
    }
    
    // Build the event payload
    const event = {
      eventType: 'NpsResponsePoc',
      qualtricsResponseId: responseId,
      userId,
      sessionId,
      npsScore,
      npsCategory,
      responseTimestamp: finalResponseTimestamp,
      receivedTimestamp
    };
    
    // Add optional fields if present
    if (comment) event.npsComment = comment;
    if (surveySource) event.surveySource = surveySource;
    
    // Attach to request for next middleware
    req.npsEvent = event;
    logger.debug(`[${responseId}] NPS event processed successfully`);
    next();
  } catch (error) {
    logger.error(`[${responseId}] Error processing NPS data: ${error.message}`);
    next(error);
  }
}

module.exports = processNps;