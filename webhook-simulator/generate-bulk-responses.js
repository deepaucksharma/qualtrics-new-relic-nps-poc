// Bulk Qualtrics NPS Response Generator
// Generates realistic NPS data in large volumes
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { program } = require('commander');
const { faker } = require('@faker-js/faker');

// Configuration
const INTEGRATION_SERVICE_URL = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3001/webhook/qualtrics';

// Constants
const QUALTRICS_SURVEY_ID = 'SV_QualtricsSimulator';
const QUALTRICS_OWNER_ID = 'UR_SimulatedOwner';

// Response distributions - realistic NPS distribution
const SCORE_DISTRIBUTION = {
  // Promoters (9-10): ~35%
  10: 20,
  9: 15,
  // Passives (7-8): ~25%
  8: 15,
  7: 10,
  // Detractors (0-6): ~40%
  6: 8,
  5: 8,
  4: 7,
  3: 7,
  2: 5,
  1: 3,
  0: 2
};

// Comment probability - 65% of respondents leave comments
const COMMENT_PROBABILITY = 0.65;

// Define common positive/negative phrases for more realistic comments
const POSITIVE_PHRASES = [
  "Love the product!",
  "Works great for my needs.",
  "The best solution I've found.",
  "Intuitive and reliable.",
  "Excellent customer service.",
  "Very satisfied with the performance.",
  "Highly recommend to others.",
  "Saves me a lot of time."
];

const NEUTRAL_PHRASES = [
  "It's okay, but could be better.",
  "Gets the job done, but has limitations.",
  "Some features are good, others need work.",
  "Works as expected, nothing special.",
  "Average product compared to alternatives.",
  "Good value but missing some functionality.",
  "Somewhat satisfied with the experience."
];

const NEGATIVE_PHRASES = [
  "Difficult to use.",
  "Too many bugs and glitches.",
  "Customer support was unhelpful.",
  "Missing key features.",
  "The interface is confusing.",
  "Constant performance issues.",
  "Not worth the price.",
  "Disappointing experience overall."
];

/**
 * Generate a Qualtrics-format response ID
 */
function generateResponseId() {
  return 'R_' + Math.random().toString(36).substring(2, 12).toUpperCase();
}



/**
 * Format a timestamp in Qualtrics ISO format
 */
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Create embedded data object
 */
function createEmbeddedData(userId, sessionId, source) {
  return {
    userId: userId,
    sessionId: sessionId,
    surveySource: source
  };
}

/**
 * Create NPS question response
 */
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

/**
 * Create comment question response
 */
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

/**
 * Generate a realistic comment based on NPS score
 */
function generateComment(score) {
  // Some responses don't have comments
  if (Math.random() > COMMENT_PROBABILITY) {
    return "";
  }
  
  let phrases;
  let commentLength;
  
  // Pick appropriate phrases and comment length based on score
  if (score >= 9) {
    phrases = POSITIVE_PHRASES;
    commentLength = Math.floor(Math.random() * 2) + 1; // 1-2 positive phrases
  } else if (score >= 7) {
    phrases = [...POSITIVE_PHRASES, ...NEUTRAL_PHRASES];
    commentLength = Math.floor(Math.random() * 2) + 1; // 1-2 mixed phrases
  } else if (score >= 4) {
    phrases = [...NEUTRAL_PHRASES, ...NEGATIVE_PHRASES];
    commentLength = Math.floor(Math.random() * 2) + 1; // 1-2 mixed phrases
  } else {
    phrases = NEGATIVE_PHRASES;
    commentLength = Math.floor(Math.random() * 3) + 1; // 1-3 negative phrases
  }
  
  // Build comment from random phrases
  const selectedPhrases = [];
  for (let i = 0; i < commentLength; i++) {
    const randomIndex = Math.floor(Math.random() * phrases.length);
    const phrase = phrases[randomIndex];
    if (!selectedPhrases.includes(phrase)) {
      selectedPhrases.push(phrase);
    }
  }
  
  // Add some custom content for more realism
  if (Math.random() > 0.5) {
    selectedPhrases.push(faker.lorem.sentence(Math.floor(Math.random() * 10) + 3));
  }
  
  return selectedPhrases.join(' ');
}

/**
 * Generate a random user ID
 */
function generateUserId() {
  // Option 1: UUID format
  if (Math.random() < 0.4) {
    return faker.string.uuid();
  }
  
  // Option 2: email-based user ID
  if (Math.random() < 0.7) {
    return faker.internet.email().toLowerCase();
  }
  
  // Option 3: alphanumeric ID
  return `user_${faker.string.alphanumeric(8)}`;
}

/**
 * Generate a random session ID
 */
function generateSessionId() {
  // Common format for session IDs
  return `sess_${faker.string.alphanumeric(16)}`;
}

/**
 * Create a complete Qualtrics-format webhook payload
 */
function createQualtricsPayload(options) {
  const responseId = options.responseId || generateResponseId();
  const surveyId = QUALTRICS_SURVEY_ID;
  const ownerId = QUALTRICS_OWNER_ID;
  const responseDate = formatTimestamp(options.timestamp || new Date());
  
  // Create the complete Qualtrics-format payload
  return {
    "responseId": responseId,
    "surveyId": surveyId,
    "ownerId": ownerId,
    "responseDate": responseDate,
    "values": {
      "startDate": formatTimestamp(new Date(options.timestamp.getTime() - (Math.random() * 300000))), // 0-5 minutes before end
      "endDate": responseDate,
      "status": "0",
      "progress": "100",
      "duration": Math.floor(Math.random() * 600) + 60, // 1-10 minutes
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
      options.source || "bulk-simulator"
    )
  };
}

/**
 * Generate a weighted random NPS score based on realistic distribution
 */
function generateWeightedNpsScore() {
  const totalWeight = Object.values(SCORE_DISTRIBUTION).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [score, weight] of Object.entries(SCORE_DISTRIBUTION)) {
    random -= weight;
    if (random <= 0) {
      return parseInt(score);
    }
  }
  
  return 8; // Default if something goes wrong
}

/**
 * Send a webhook to the integration service
 */
async function sendWebhook(payload) {
  try {
    const response = await axios.post(
      INTEGRATION_SERVICE_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Qualtrics/1.0'
        }
      }
    );
    
    return {
      success: true,
      status: response.status,
      responseId: payload.responseId,
      userId: payload.embeddedData.userId,
      npsScore: payload.values.npsScoreRaw
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      responseId: payload.responseId,
      error: error.message
    };
  }
}

/**
 * Generate a batch of realistic responses over a time period
 */
async function generateResponses(options) {
  const {
    count,
    startDate,
    endDate,
    delayBetweenRequests,
    outputToFile,
    sendToService
  } = options;
  
  console.log(`Generating ${count} synthetic Qualtrics NPS responses...`);
  
  // Calculate time range
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const timeRange = endTime - startTime;
  
  // Prepare results array
  const results = [];
  const responses = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random timestamp within the range
    const timestamp = new Date(startTime + Math.random() * timeRange);
    
    // Generate NPS score based on realistic distribution
    const npsScore = generateWeightedNpsScore();
    
    // Generate comment based on score
    const comment = generateComment(npsScore);
    
    // Generate user and session IDs
    const userId = generateUserId();
    const sessionId = generateSessionId();
    
    // Create Qualtrics webhook payload
    const payload = createQualtricsPayload({
      npsScore,
      comment,
      userId,
      sessionId,
      timestamp,
      source: "bulk-generator"
    });
    
    responses.push(payload);
    
    // Send to service if requested
    if (sendToService) {
      // Introduce delay between requests if specified
      if (i > 0 && delayBetweenRequests > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      }
      
      process.stdout.write(`Sending webhook ${i+1}/${count}...\r`);
      const result = await sendWebhook(payload);
      results.push(result);
    }
  }
  
  console.log("\nFinished generating responses!");
  
  // Save to file if requested
  if (outputToFile) {
    const filename = `qualtrics_responses_${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(responses, null, 2));
    console.log(`Saved ${count} responses to ${filename}`);
  }
  
  // Print summary if sent to service
  if (sendToService) {
    const successful = results.filter(r => r.success).length;
    console.log(`\nResults: ${successful}/${count} responses sent successfully`);
    
    if (successful < count) {
      console.log(`Failed responses: ${results.filter(r => !r.success).length}`);
    }
    
    // Calculate NPS from the simulated data
    const promoters = results.filter(r => r.success && parseInt(r.npsScore) >= 9).length;
    const passives = results.filter(r => r.success && parseInt(r.npsScore) >= 7 && parseInt(r.npsScore) <= 8).length;
    const detractors = results.filter(r => r.success && parseInt(r.npsScore) <= 6).length;
    
    const nps = Math.round((promoters - detractors) / successful * 100);
    
    console.log(`\nSimulated NPS Score: ${nps}`);
    console.log(`Promoters: ${promoters} (${Math.round(promoters/successful*100)}%)`);
    console.log(`Passives: ${passives} (${Math.round(passives/successful*100)}%)`);
    console.log(`Detractors: ${detractors} (${Math.round(detractors/successful*100)}%)`);
  }
  
  return { responses, results };
}

// Command line interface
program
  .name('generate-bulk-responses')
  .description('Generate bulk Qualtrics NPS responses with realistic patterns')
  .version('1.0.0')
  .option('-c, --count <number>', 'Number of responses to generate', '100')
  .option('-d, --days <number>', 'Number of days in the past to generate data for', '30')
  .option('-o, --output', 'Save responses to file', false)
  .option('-s, --send', 'Send webhooks to integration service', false)
  .option('-r, --rate <ms>', 'Delay between requests in milliseconds', '200')
  .action(async (options) => {
    // Parse count as integer
    const count = parseInt(options.count);
    if (isNaN(count) || count <= 0) {
      console.error('Error: Count must be a positive number');
      return;
    }
    
    // Generate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(options.days));
    
    // Parse delay as integer
    const delay = parseInt(options.rate);
    
    console.log(`Generating ${count} responses between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`);
    
    if (options.send) {
      console.log(`Sending webhooks to: ${INTEGRATION_SERVICE_URL}`);
      console.log(`Request delay: ${delay}ms`);
    }
    
    try {
      await generateResponses({
        count,
        startDate,
        endDate,
        delayBetweenRequests: options.send ? delay : 0,
        outputToFile: options.output,
        sendToService: options.send
      });
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

// Run the program
program.parse();
