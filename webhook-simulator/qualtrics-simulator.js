// Qualtrics Webhook Simulator - Accurately mimics Qualtrics webhook format
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const inquirer = require('inquirer');
const chalk = require('chalk');

// Configuration
const INTEGRATION_SERVICE_URL = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3001/webhook/qualtrics';
const WEBHOOK_SECRET = process.env.QUALTRICS_WEBHOOK_SECRET || 'your_webhook_secret_here';

// Constants
const QUALTRICS_SURVEY_ID = 'SV_QualtricsSimulator';
const QUALTRICS_OWNER_ID = 'UR_SimulatedOwner';

// Validate environment
if (!WEBHOOK_SECRET) {
  console.error(chalk.red('Error: QUALTRICS_WEBHOOK_SECRET environment variable is required'));
  process.exit(1);
}

/**
 * Generate a Qualtrics-format response ID
 * Qualtrics response IDs typically start with 'R_' followed by a unique identifier
 */
function generateResponseId() {
  return 'R_' + Math.random().toString(36).substring(2, 12).toUpperCase();
}

/**
 * Generate HMAC signature exactly as Qualtrics would
 * Qualtrics uses HMAC-SHA256 with the shared secret
 */
function generateSignature(payload) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

/**
 * Format a timestamp in Qualtrics ISO format
 * Qualtrics uses ISO 8601 format for timestamps
 */
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Create a Qualtrics-format embedded data object
 * This mimics how Qualtrics would structure embedded data
 */
function createEmbeddedData(userId, sessionId, source) {
  return {
    userId: userId,
    sessionId: sessionId,
    surveySource: source
  };
}

/**
 * Create a Qualtrics-format question response
 * This mimics the structure of a Qualtrics NPS question response
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
 * Create a Qualtrics-format comment response
 * This mimics the structure of a Qualtrics open text question response
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
 * Create a complete Qualtrics-format webhook payload
 */
function createQualtricsPayload(options) {
  const responseId = options.responseId || generateResponseId();
  const surveyId = QUALTRICS_SURVEY_ID;
  const ownerId = QUALTRICS_OWNER_ID;
  const responseDate = formatTimestamp();
  
  // Create the complete Qualtrics-format payload
  return {
    "responseId": responseId,
    "surveyId": surveyId,
    "ownerId": ownerId,
    "responseDate": responseDate,
    "values": {
      "startDate": formatTimestamp(new Date(Date.now() - 300000)), // 5 minutes ago
      "endDate": responseDate,
      "status": "0",
      "progress": "100",
      "duration": 287,
      "finished": "1",
      "recordedDate": responseDate,
      "npsScoreRaw": options.npsScore.toString(), // Add the raw score for our integration
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
      options.source || "qualtrics-simulator"
    )
  };
}

/**
 * Send a webhook to the integration service
 */
async function sendWebhook(payload) {
  console.log(chalk.blue('\nPreparing to send webhook to:'), chalk.cyan(INTEGRATION_SERVICE_URL));
  
  // Generate HMAC signature
  const signature = generateSignature(payload);
  console.log(chalk.blue('Generated HMAC signature:'), chalk.gray(signature));

  try {
    console.log(chalk.blue('\nSending webhook...'));
    
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

    console.log(chalk.green('\n✓ Webhook sent successfully!'));
    console.log(chalk.blue('Response Status:'), chalk.cyan(response.status));
    console.log(chalk.blue('Response Data:'), response.data);
    
    console.log(chalk.green('\n✓ To see the data in New Relic, run this NRQL query:'));
    console.log(chalk.cyan(`SELECT * FROM NpsResponsePoc WHERE userId = '${payload.embeddedData.userId}' AND sessionId = '${payload.embeddedData.sessionId}' SINCE 10 minutes ago`));
    
    return true;
  } catch (error) {
    console.error(chalk.red('\n✗ Error sending webhook:'));
    if (error.response) {
      console.error(chalk.red('Status:'), error.response.status);
      console.error(chalk.red('Data:'), error.response.data);
    } else {
      console.error(chalk.red(error.message));
    }
    return false;
  }
}

/**
 * Interactive mode - prompt for webhook details
 */
async function interactiveMode() {
  console.log(chalk.blue('\n=== Interactive Mode ==='));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'userId',
      message: 'Enter User ID:',
      default: 'POC_USER_' + Math.floor(Math.random() * 10000)
    },
    {
      type: 'input',
      name: 'sessionId',
      message: 'Enter Session ID:',
      default: 'SESSION_' + Math.random().toString(36).substring(2, 10),
      validate: input => input.length > 0 || 'Session ID is required'
    },
    {
      type: 'number',
      name: 'npsScore',
      message: 'Enter NPS score (0-10):',
      default: 9,
      validate: input => (input >= 0 && input <= 10) || 'Score must be between 0 and 10'
    },
    {
      type: 'input',
      name: 'comment',
      message: 'Enter optional comment:',
      default: 'This is a simulated NPS response from Qualtrics'
    }
  ]);

  // Create Qualtrics-format payload
  const payload = createQualtricsPayload({
    userId: answers.userId,
    sessionId: answers.sessionId,
    npsScore: answers.npsScore,
    comment: answers.comment,
    source: 'interactive-simulator'
  });

  // Show the payload
  console.log(chalk.blue('\nGenerated Qualtrics webhook payload:'));
  console.log(chalk.gray(JSON.stringify(payload, null, 2)));

  // Confirm before sending
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Send this webhook?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Webhook canceled'));
    return false;
  }

  // Send the webhook
  return await sendWebhook(payload);
}

/**
 * Random mode - generate random values
 */
async function randomMode() {
  console.log(chalk.blue('\n=== Random Mode ==='));
  
  // Generate random values
  const randomScore = Math.floor(Math.random() * 11); // 0-10
  const randomUserId = 'POC_USER_' + Math.floor(Math.random() * 10000);
  const randomSessionId = 'SESSION_' + Math.random().toString(36).substring(2, 10);
  const comments = [
    'Great product, would recommend!',
    'Works well but could use some improvements',
    'I had some issues with the interface',
    'Customer service was excellent',
    'Needs more features to be competitive'
  ];
  const randomComment = comments[Math.floor(Math.random() * comments.length)];

  // Create Qualtrics-format payload
  const payload = createQualtricsPayload({
    userId: randomUserId,
    sessionId: randomSessionId,
    npsScore: randomScore,
    comment: randomComment,
    source: 'random-simulator'
  });

  console.log(chalk.green('Generated random values:'));
  console.log(chalk.blue('User ID:'), chalk.cyan(randomUserId));
  console.log(chalk.blue('Session ID:'), chalk.cyan(randomSessionId));
  console.log(chalk.blue('NPS Score:'), chalk.cyan(randomScore));
  console.log(chalk.blue('Comment:'), chalk.cyan(randomComment));

  // Confirm before sending
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Send this webhook?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Webhook canceled'));
    return false;
  }

  // Send the webhook
  return await sendWebhook(payload);
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue.bold('\n=== Qualtrics Webhook Simulator ==='));
  console.log(chalk.gray('This tool accurately simulates Qualtrics NPS webhook requests'));
  console.log(chalk.gray('Target URL:'), chalk.cyan(INTEGRATION_SERVICE_URL));
  console.log(chalk.gray('Secret Key:'), chalk.cyan(WEBHOOK_SECRET ? '✓ Configured' : '✗ Missing'));

  // Ask for simulation mode
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Select simulation mode:',
      choices: [
        { name: 'Interactive (manually enter values)', value: 'interactive' },
        { name: 'Random (generate random values)', value: 'random' },
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);

  let success = false;

  if (mode === 'interactive') {
    success = await interactiveMode();
  } else if (mode === 'random') {
    success = await randomMode();
  } else {
    console.log(chalk.blue('Exiting simulator'));
    return;
  }

  // Ask if they want to send another
  if (success) {
    const { another } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'another',
        message: 'Send another webhook?',
        default: false
      }
    ]);

    if (another) {
      console.log('\n');
      await main();
    } else {
      console.log(chalk.blue('\nThank you for using the Qualtrics Webhook Simulator!'));
    }
  } else {
    // If there was an error, ask if they want to try again
    const { retry } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'retry',
        message: 'Would you like to try again?',
        default: true
      }
    ]);

    if (retry) {
      console.log('\n');
      await main();
    } else {
      console.log(chalk.blue('\nExiting Qualtrics Webhook Simulator'));
    }
  }
}

// Start the application
main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});
