// Validation middleware for webhook payload
const { createLogger } = require('../utils/logger');

const logger = createLogger('validation-middleware');

/**
 * Extracts NPS data from Qualtrics webhook payload
 * Handles both simple format and full Qualtrics format
 */
function extractNpsData(body) {
  // Initialize extracted data
  const data = {
    responseId: null,
    npsScoreRaw: null,
    userId: null,
    sessionId: null,
    comment: null,
    surveySource: null,
    responseTimestamp: null
  };
  
  // Check if this is a simple format (direct properties)
  if (body.responseId && body.npsScoreRaw) {
    // Simple format - direct properties
    data.responseId = body.responseId;
    data.npsScoreRaw = body.npsScoreRaw;
    data.userId = body.userId;
    data.sessionId = body.sessionId;
    data.comment = body.comment;
    data.surveySource = body.surveySource;
    data.responseTimestamp = body.responseTimestamp;
    
    logger.debug(`[${data.responseId}] Detected simple payload format`);
    return data;
  }
  
  // Check if this is a Qualtrics format
  if (body.responseId && body.surveyId && body.embeddedData) {
    // Qualtrics format - extract from embedded data and questions
    data.responseId = body.responseId;
    
    // Extract from embeddedData
    if (body.embeddedData) {
      data.userId = body.embeddedData.userId;
      data.sessionId = body.embeddedData.sessionId;
      data.surveySource = body.embeddedData.surveySource;
    }
    
    // Extract NPS score from values or questions
    if (body.values && body.values.npsScoreRaw) {
      data.npsScoreRaw = body.values.npsScoreRaw;
    } else if (body.questions) {
      // Look for NPS question (typically QID1 or similar)
      const npsQuestion = Object.values(body.questions).find(q => 
        q.QuestionType === 'NPS' || (q.Answers && q.Answers.Value)
      );
      
      if (npsQuestion && npsQuestion.Answers && npsQuestion.Answers.Value) {
        data.npsScoreRaw = npsQuestion.Answers.Value;
      }
      
      // Look for comment question (typically QID2 or similar)
      const commentQuestion = Object.values(body.questions).find(q => 
        q.QuestionType === 'TE' || (q.Answers && q.Answers.Text)
      );
      
      if (commentQuestion && commentQuestion.Answers && commentQuestion.Answers.Text) {
        data.comment = commentQuestion.Answers.Text;
      }
    }
    
    // Extract timestamp
    if (body.responseDate) {
      data.responseTimestamp = new Date(body.responseDate).getTime();
    } else if (body.values && body.values.endDate) {
      data.responseTimestamp = new Date(body.values.endDate).getTime();
    }
    
    logger.debug(`[${data.responseId}] Detected Qualtrics payload format`);
    return data;
  }
  
  // Unknown format
  logger.warn('Unknown payload format received');
  return data;
}

/**
 * Validates the webhook payload
 */
function validatePayload(req, res, next) {
  // Extract NPS data from the payload
  const extractedData = extractNpsData(req.body);
  
  // Store extracted data on the request for downstream middleware
  req.extractedData = extractedData;
  
  const { responseId, npsScoreRaw, userId, sessionId } = extractedData;
  
  // Check for required fields
  const missingFields = [];
  if (!responseId) missingFields.push('responseId');
  if (!npsScoreRaw) missingFields.push('npsScoreRaw');
  if (!userId) missingFields.push('userId');
  if (!sessionId) missingFields.push('sessionId');
  
  if (missingFields.length > 0) {
    logger.warn(`[${responseId || 'unknown'}] Validation failed: Missing fields: ${missingFields.join(', ')}`);
    return res.status(400).json({ 
      error: 'Missing required fields', 
      fields: missingFields 
    });
  }
  
  // Validate npsScoreRaw
  const npsScore = parseInt(npsScoreRaw, 10);
  if (isNaN(npsScore) || npsScore < 0 || npsScore > 10) {
    logger.warn(`[${responseId}] Validation failed: Invalid npsScoreRaw value: ${npsScoreRaw}`);
    return res.status(400).json({ 
      error: 'Invalid npsScoreRaw value',
      detail: 'Must be a number between 0 and 10'
    });
  }
  
  // Add validated score to request for downstream middleware
  req.npsScore = npsScore;
  logger.debug(`[${responseId}] Payload validation successful`);
  next();
}

module.exports = validatePayload;