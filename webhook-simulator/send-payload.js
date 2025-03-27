// Script to send a specific NPS payload to the Integration Service
require('dotenv').config();
const axios = require('axios');

// Configuration
const INTEGRATION_SERVICE_URL = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3001/webhook/qualtrics';

// Default payload - can be modified as needed
const payload = {
  "responseId": "R_POC_SIMULATED_" + Math.random().toString(36).substring(2, 8),
  "npsScoreRaw": "8",
  "userId": "POC_USER_1830",
  "sessionId": "SESSION_" + Math.random().toString(36).substring(2, 12),
  "comment": "POC Test Comment - This looks great!",
  "surveySource": "poc-app",
  "responseTimestamp": Date.now()
};

// Send the webhook
async function sendWebhook() {
  console.log('Sending webhook payload to:', INTEGRATION_SERVICE_URL);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      INTEGRATION_SERVICE_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', response.data);
    console.log('\nSuccessfully sent webhook to integration service!');
    console.log('To see the data in New Relic, run a query like:');
    console.log(`SELECT * FROM NpsResponsePoc WHERE userId = '${payload.userId}' AND sessionId = '${payload.sessionId}' SINCE 10 minutes ago`);
  } catch (error) {
    console.error('\nError sending webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Execute the webhook send
sendWebhook();
