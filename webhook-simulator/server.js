// Webhook Simulator API Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3002;

// Constants
const INTEGRATION_SERVICE_URL = process.env.INTEGRATION_SERVICE_URL || 'http://integration-service:3001/webhook/qualtrics';
const WEBHOOK_SECRET = process.env.QUALTRICS_WEBHOOK_SECRET || 'demo_secret_key_for_webhooks_12345';
const QUALTRICS_SURVEY_ID = 'SV_QualtricsSimulator';
const QUALTRICS_OWNER_ID = 'UR_SimulatedOwner';

// Middleware
app.use(cors());
app.use(express.json());

// Store simulation results
let simulationResults = [];
const MAX_RESULTS = 100; // Limit stored results

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get all simulation results
app.get('/results', (req, res) => {
  res.json(simulationResults);
});

// Clear simulation results
app.post('/results/clear', (req, res) => {
  simulationResults = [];
  res.json({ success: true, message: 'Results cleared' });
});

// Generate response ID
function generateResponseId() {
  return 'R_' + Math.random().toString(36).substring(2, 12).toUpperCase();
}

// Generate HMAC signature
function generateSignature(payload) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Format timestamp
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

// Create embedded data
function createEmbeddedData(userId, sessionId, source) {
  return {
    userId: userId,
    sessionId: sessionId,
    surveySource: source
  };
}

// Create NPS question response
function createNpsQuestionResponse(score) {
  return {
    "QID1": {
      "QuestionID": "QID1",
      "QuestionType": "NPS",
      "QuestionText": "How likely are you to recommend our product to a friend or colleague?",
      "QuestionLabel": "NPS Score",
      "Choices": {
        "0": { "Display": "0 - Not at all likely" },
        "10": { "Display": "10 - Extremely likely" }
      },
      "Answers": {
        "Value": score.toString()
      }
    }
  };
}

// Create comment question response
function createCommentQuestionResponse(comment) {
  return {
    "QID2": {
      "QuestionID": "QID2",
      "QuestionType": "TE",
      "QuestionText": "What is the primary reason for your score?",
      "QuestionLabel": "NPS Comment",
      "Answers": {
        "Text": comment
      }
    }
  };
}

// Create Qualtrics payload
function createQualtricsPayload(options) {
  const responseId = options.responseId || generateResponseId();
  const surveyId = QUALTRICS_SURVEY_ID;
  const ownerId = QUALTRICS_OWNER_ID;
  const responseDate = formatTimestamp(options.timestamp || new Date());
  
  return {
    "responseId": responseId,
    "surveyId": surveyId,
    "ownerId": ownerId,
    "responseDate": responseDate,
    "values": {
      "startDate": formatTimestamp(new Date((options.timestamp || new Date()).getTime() - 300000)), // 5 minutes ago
      "endDate": responseDate,
      "status": "0",
      "progress": "100",
      "duration": 287,
      "finished": "1",
      "recordedDate": responseDate,
      "npsScoreRaw": options.npsScore.toString(),
      "_recordId": responseId
    },
    "labels": {},
    "questions": {
      ...createNpsQuestionResponse(options.npsScore),
      ...createCommentQuestionResponse(options.comment)
    },
    "embeddedData": createEmbeddedData(
      options.userId,
      options.sessionId,
      options.source || "sample-app-simulator"
    )
  };
}

// Send webhook
async function sendWebhook(payload) {
  const signature = generateSignature(payload);
  
  try {
    const response = await axios.post(
      INTEGRATION_SERVICE_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Qualtrics-Signature': signature,
          'User-Agent': 'Qualtrics/1.0'
        }
      }
    );
    
    return {
      success: true,
      status: response.status,
      message: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      details: error.response?.data
    };
  }
}

// Add a result to the results array
function addResult(result) {
  // Add timestamp to result
  result.timestamp = new Date();
  
  // Add to beginning of array (most recent first)
  simulationResults.unshift(result);
  
  // Limit the size of the results array
  if (simulationResults.length > MAX_RESULTS) {
    simulationResults = simulationResults.slice(0, MAX_RESULTS);
  }
}

// Send a single webhook (simple mode)
app.post('/simulate/simple', async (req, res) => {
  const { userId, sessionId, npsScore, comment } = req.body;
  
  const payload = createQualtricsPayload({
    npsScore: npsScore || Math.floor(Math.random() * 11),
    comment: comment || `Test comment from sample app - ${new Date().toISOString()}`,
    userId,
    sessionId,
    source: 'sample-app-simple'
  });
  
  try {
    const result = await sendWebhook(payload);
    result.type = 'simple';
    result.payload = payload;
    addResult(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate random response with realistic distribution
app.post('/simulate/random', async (req, res) => {
  const { userId, sessionId, count = 1 } = req.body;
  const results = [];
  
  try {
    // Score distribution (realistic)
    const scoreDistribution = {
      10: 20, 9: 15,  // Promoters: 35%
      8: 15, 7: 10,   // Passives: 25%
      6: 8, 5: 8, 4: 7, 3: 7, 2: 5, 1: 3, 0: 2  // Detractors: 40%
    };
    
    // Comment templates based on score type
    const commentTemplates = {
      high: [
        "Love the product!",
        "Works great for my needs.",
        "The best solution I've found.",
        "Intuitive and reliable.",
        "Excellent customer service."
      ],
      mid: [
        "It's okay, but could be better.",
        "Gets the job done, but has limitations.",
        "Some features are good, others need work.",
        "Works as expected, nothing special."
      ],
      low: [
        "Difficult to use.",
        "Too many bugs and glitches.",
        "Customer support was unhelpful.",
        "Missing key features.",
        "The interface is confusing."
      ]
    };

    // Generate weighted random score
    function getRandomScore() {
      const totalWeight = Object.values(scoreDistribution).reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      
      for (const [score, weight] of Object.entries(scoreDistribution)) {
        random -= weight;
        if (random <= 0) {
          return parseInt(score);
        }
      }
      
      return 8; // Default if something goes wrong
    }
    
    // Get appropriate comment for score
    function getCommentForScore(score) {
      let templates;
      if (score >= 9) templates = commentTemplates.high;
      else if (score >= 7) templates = commentTemplates.mid;
      else templates = commentTemplates.low;
      
      return templates[Math.floor(Math.random() * templates.length)];
    }
    
    // Process specified number of responses
    for (let i = 0; i < count; i++) {
      const score = getRandomScore();
      const comment = getCommentForScore(score);
      
      const payload = createQualtricsPayload({
        npsScore: score,
        comment,
        userId,
        sessionId,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)), // Random time in the last hour
        source: 'sample-app-random'
      });
      
      const result = await sendWebhook(payload);
      result.type = 'random';
      result.payload = payload;
      addResult(result);
      results.push(result);
      
      // Small delay between requests
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Bulk generation with specified parameters
app.post('/simulate/bulk', async (req, res) => {
  const { 
    userId, 
    sessionId, 
    count = 10, 
    daysSpread = 7,
    promoterPercent = 35,
    passivePercent = 25,
    detractorPercent = 40
  } = req.body;
  
  // Validate percentages
  const totalPercent = promoterPercent + passivePercent + detractorPercent;
  if (totalPercent !== 100) {
    return res.status(400).json({
      success: false,
      error: `Percentages must add up to 100, got ${totalPercent}`
    });
  }
  
  // Limit maximum count for performance
  const actualCount = Math.min(count, 500);
  
  const results = [];
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - daysSpread);
  const endTime = new Date();
  const timeRange = endTime - startTime;
  
  try {
    // Process in batches with feedback
    const batchSize = 10;
    const batches = Math.ceil(actualCount / batchSize);
    
    // Return initial response to client
    res.json({
      success: true,
      message: `Started bulk generation of ${actualCount} responses spread over ${daysSpread} days`,
      batchCount: batches,
      estimatedTimeSeconds: Math.ceil(actualCount * 0.2)
    });
    
    // Continue processing in the background
    const processRemainingBatches = async () => {
      // Track metrics for final results
      let totalSuccessful = 0;
      let totalFailed = 0;
      let promoters = 0;
      let passives = 0;
      let detractors = 0;
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, actualCount);
        const batchCount = batchEnd - batchStart;
        
        for (let i = 0; i < batchCount; i++) {
          // Generate timestamp within range
          const timestamp = new Date(startTime.getTime() + Math.random() * timeRange);
          
          // Determine score category based on percentages
          const randPercent = Math.random() * 100;
          let score;
          let category;
          
          if (randPercent < promoterPercent) {
            // Promoter (9-10)
            score = Math.random() < 0.5 ? 9 : 10;
            category = 'promoter';
            promoters++;
          } else if (randPercent < (promoterPercent + passivePercent)) {
            // Passive (7-8)
            score = Math.random() < 0.5 ? 7 : 8;
            category = 'passive';
            passives++;
          } else {
            // Detractor (0-6)
            score = Math.floor(Math.random() * 7);
            category = 'detractor';
            detractors++;
          }
          
          // Generate appropriate comment
          let comment = "";
          if (category === 'promoter') {
            comment = "Very satisfied with the service. Would definitely recommend!";
          } else if (category === 'passive') {
            comment = "The service is good, but there's room for improvement.";
          } else {
            comment = "Disappointed with several aspects of the service.";
          }
          
          const payload = createQualtricsPayload({
            npsScore: score,
            comment,
            userId,
            sessionId,
            timestamp,
            source: 'sample-app-bulk'
          });
          
          try {
            const result = await sendWebhook(payload);
            result.type = 'bulk';
            result.payload = payload;
            result.batchIndex = batchIndex;
            result.category = category;
            addResult(result);
            
            if (result.success) {
              totalSuccessful++;
            } else {
              totalFailed++;
            }
            
            // Small delay between requests to avoid overwhelming the service
            if (i < batchCount - 1 || batchIndex < batches - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (error) {
            console.error('Error in bulk generation:', error);
            totalFailed++;
          }
        }
      }
      
      // Store final summary result
      const finalResult = {
        type: 'bulk-summary',
        timestamp: new Date(),
        startTime,
        endTime,
        daysSpread,
        totalCount: actualCount,
        successful: totalSuccessful,
        failed: totalFailed,
        npsScore: Math.round(((promoters - detractors) / (totalSuccessful || 1)) * 100),
        categories: {
          promoters,
          passives,
          detractors
        },
        percentages: {
          promoters: Math.round((promoters / (totalSuccessful || 1)) * 100),
          passives: Math.round((passives / (totalSuccessful || 1)) * 100),
          detractors: Math.round((detractors / (totalSuccessful || 1)) * 100)
        },
        requestedDistribution: {
          promoterPercent,
          passivePercent,
          detractorPercent
        }
      };
      addResult(finalResult);
    };
    
    // Start processing in the background
    processRemainingBatches().catch(err => console.error('Background processing error:', err));
    
  } catch (error) {
    console.error('Error starting bulk simulation:', error);
    // Response already sent, just log the error
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook Simulator API running on port ${PORT}`);
});
