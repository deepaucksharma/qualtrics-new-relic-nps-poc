// Webhook Simulator for Qualtrics-New Relic NPS Integration POC
require('dotenv').config();
const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');

// Configuration
const INTEGRATION_SERVICE_URL = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3001/webhook/qualtrics';

// Generate a random response ID
function generateResponseId() {
  return 'R_POC_SIM_' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Main function
async function main() {
  console.log(chalk.blue('=== Qualtrics Webhook Simulator ==='));
  console.log('This tool simulates Qualtrics NPS webhook requests');
  console.log('Target URL:', chalk.cyan(INTEGRATION_SERVICE_URL));
  console.log();

  // Ask for simulation mode
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Select simulation mode:',
      choices: [
        { name: 'Interactive (manually enter values)', value: 'interactive' },
        { name: 'Generate random values', value: 'random' },
        { name: 'Use values from a file', value: 'file' }
      ]
    }
  ]);

  let payload;

  if (mode === 'interactive') {
    // Get user input
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
        default: 'This is a simulated NPS response'
      }
    ]);

    // Create payload
    payload = {
      responseId: generateResponseId(),
      npsScoreRaw: answers.npsScore.toString(),
      userId: answers.userId,
      sessionId: answers.sessionId,
      comment: answers.comment || undefined,
      surveySource: 'webhook-simulator',
      responseTimestamp: Date.now()
    };
  } else if (mode === 'random') {
    // Generate random values
    const randomScore = Math.floor(Math.random() * 11); // 0-10
    const randomUserId = 'POC_USER_' + Math.floor(Math.random() * 10000);
    const randomSessionId = Math.random().toString(36).substring(2, 12);

    payload = {
      responseId: generateResponseId(),
      npsScoreRaw: randomScore.toString(),
      userId: randomUserId,
      sessionId: randomSessionId,
      comment: 'This is a randomly generated NPS response',
      surveySource: 'webhook-simulator-random',
      responseTimestamp: Date.now()
    };
    
    console.log(chalk.green('Generated random values:'));
    console.log('User ID:', chalk.cyan(randomUserId));
    console.log('Session ID:', chalk.cyan(randomSessionId));
    console.log('NPS Score:', chalk.cyan(randomScore));
  } else {
    // File mode - would require another implementation
    console.log(chalk.yellow('File mode not implemented yet'));
    return;
  }

  // Show payload
  console.log(chalk.green('\nWebhook Payload:'));
  console.log(JSON.stringify(payload, null, 2));

  // Ask for confirmation
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Send webhook?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Webhook canceled'));
    return;
  }

  // Send the webhook
  console.log(chalk.blue('\nSending webhook...'));
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

    console.log(chalk.green('\nResponse Status:'), chalk.cyan(response.status));
    console.log(chalk.green('Response Data:'), response.data);
  } catch (error) {
    console.error(chalk.red('\nError sending webhook:'));
    if (error.response) {
      console.error('Status:', chalk.red(error.response.status));
      console.error('Data:', error.response.data);
    } else {
      console.error(chalk.red(error.message));
    }
  }

  // Ask if they want to send another
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
    console.log(chalk.blue('\nThank you for using the Webhook Simulator!'));
  }
}

// Start the application
main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});