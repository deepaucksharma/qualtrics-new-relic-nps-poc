# Qualtrics-New Relic NPS Integration POC

This project demonstrates the integration between Qualtrics NPS survey responses and New Relic Browser Agent data, enabling the correlation of user experience metrics with customer feedback.

## Architecture Overview

The POC consists of three main components:

1. **Sample Web Application**: A web app instrumented with New Relic Browser Agent that captures userId and sessionId.
2. **Integration Service**: A backend service that receives webhook data from Qualtrics, processes it, and forwards to New Relic.
3. **Webhook Simulator**: Tools to simulate Qualtrics webhook requests for testing.

## Data Flow

1. User interacts with Sample Web App
2. New Relic Browser Agent captures performance data and user identifiers
3. Sample App displays the userId and sessionId
4. Webhook Simulator sends NPS data with matching identifiers to Integration Service
5. Integration Service validates, processes, and forwards data to New Relic
6. Data can be correlated in New Relic using NRQL queries

## Prerequisites

- Node.js 16+
- Docker and Docker Compose (for containerized setup)
- New Relic account with:
  - Browser Agent license key
  - Application ID
  - Insert API Key (for sending events)
  - User API Key (for querying data)
  - Account ID
- Qualtrics account (for production use)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/qualtrics-new-relic-nps-poc.git
cd qualtrics-new-relic-nps-poc
```

### 2. Set up environment variables

Copy the example environment file and update it with your actual API keys:

```bash
cp .env.example .env
```

Edit the `.env` file with your New Relic and Qualtrics credentials:

```
# Shared environment variables
NODE_ENV=development

# Sample Web Application
SAMPLE_APP_PORT=3000
NEW_RELIC_LICENSE_KEY=your_license_key_here
NEW_RELIC_APP_ID=your_app_id_here
NEW_RELIC_APP_NAME=NpsPocSampleApp

# Integration Service
INTEGRATION_SERVICE_PORT=3001
NEW_RELIC_INSERT_KEY=your_insert_key_here
QUALTRICS_WEBHOOK_SECRET=your_webhook_secret_here

# Webhook Simulator
INTEGRATION_SERVICE_URL=http://localhost:3001/webhook/qualtrics

# Testing
NEW_RELIC_USER_API_KEY=your_user_api_key_here
NEW_RELIC_ACCOUNT_ID=your_account_id_here
```

### 3. Start the application

#### Using Docker Compose (recommended)

```bash
docker-compose up --build
```

This will start all three services:
- Sample Web App: http://localhost:3000
- Integration Service: http://localhost:3001
- Webhook Simulator (runs as a service)

#### Using npm (for development)

```bash
# Start Sample Web Application
cd sample-app
npm install
npm start

# In a new terminal, start Integration Service
cd integration-service
npm install
npm start

# In a new terminal, use the Webhook Simulator
cd webhook-simulator
npm install
node simulate-webhook.js
```

## Using the Application

1. **Access the Sample Web Application**:
   - Open http://localhost:3000 in your browser
   - The application will display a User ID and Session ID
   - These IDs are captured by the New Relic Browser Agent

2. **Generate a Survey Link**:
   - Click the "Generate Survey Link" button
   - This creates a simulated Qualtrics survey link with the User ID and Session ID as parameters
   - In a real implementation, this link would be sent to users via email or displayed after an interaction

3. **Simulate a Webhook**:
   - Use the Qualtrics webhook simulator to send realistic test data:
     ```bash
     cd webhook-simulator
     npm run qualtrics
     ```
   - The simulator offers several options:
     - **Interactive Mode**: Manually enter userId, sessionId, NPS score, and comments
     - **Random Mode**: Generate random values for quick testing
   
   - For simpler testing, you can also use:
     ```bash
     # Simple interactive simulator
     npm run simple
     
     # Quick payload sender
     npm run send
     ```

4. **Verify in New Relic**:
   - Log into your New Relic account
   - Run the following NRQL query to see correlated data:
     ```sql
     SELECT filter(count(*), WHERE eventType() = 'PageView') as PageViews, 
            filter(count(*), WHERE eventType() = 'NpsResponsePoc') as NpsResponses, 
            latest(NpsResponsePoc.npsScore) as NpsScore, 
            latest(NpsResponsePoc.npsCategory) as NpsCategory
     FROM PageView, NpsResponsePoc
     WHERE sessionId = '<your-session-id>'
     AND userId = '<your-user-id>'
     SINCE 1 hour ago
     ```

## Project Structure

```
nps-poc/
├── docker-compose.yml        # Docker Compose configuration
├── .env.example              # Example environment variables
├── README.md                 # Project documentation
├── docs/                     # Additional documentation
│   ├── architecture.md       # Architecture overview
│   ├── api-spec.md           # API specifications
│   └── troubleshooting.md    # Troubleshooting guide
├── integration-service/      # Backend service for processing webhooks
│   ├── Dockerfile            # Container definition
│   ├── package.json          # Dependencies
│   ├── server.js             # Main application entry point
│   └── src/                  # Source code
├── sample-app/               # Sample web application with NR Browser Agent
│   ├── Dockerfile            # Container definition
│   ├── package.json          # Dependencies
│   └── app.js                # Application code
└── webhook-simulator/        # Tools for simulating webhooks
    ├── Dockerfile            # Container definition
    ├── package.json          # Dependencies
    ├── send-payload.js       # Script to send test payloads
    └── simulate-webhook.js   # Interactive webhook simulator
```

For detailed architecture information, see [docs/architecture.md](docs/architecture.md).

## Integrating with Qualtrics

This project now includes a more accurate Qualtrics webhook simulator that closely mimics the actual Qualtrics webhook format. The integration service has been updated to handle both the simplified format (used in earlier versions) and the full Qualtrics format.

### Using the Qualtrics Simulator

The new simulator (`qualtrics-simulator.js`) creates webhook payloads that match the structure of real Qualtrics webhooks:

```bash
cd webhook-simulator
npm run qualtrics
```

Key features:
- Proper Qualtrics response ID format
- Embedded data structure for userId and sessionId
- Question response format matching Qualtrics' schema
- HMAC signature generation using the same algorithm as Qualtrics
- Interactive and random data generation modes

### For Production Implementation

For a production implementation with actual Qualtrics surveys:

1. **Create a Qualtrics Survey**:
   - Include an NPS question (typically 0-10 scale)
   - Add a follow-up text entry question for comments
   - Include hidden embedded data fields for `userId` and `sessionId`
   - Set up URL parameters to capture these values:
     ```
     https://[your-qualtrics-survey-url]?userId=${userId}&sessionId=${sessionId}
     ```

2. **Configure Qualtrics Webhook**:
   - In your Qualtrics account, go to Account Settings > Webhooks
   - Create a new webhook pointing to your Integration Service endpoint
   - Set up a shared secret for HMAC validation (same as QUALTRICS_WEBHOOK_SECRET)
   - Configure the webhook to trigger on survey completion
   - Enable the "Include survey questions and responses" option

3. **Integration Service Compatibility**:
   - The integration service now automatically detects and processes the Qualtrics webhook format
   - It extracts userId and sessionId from the embedded data
   - It finds the NPS score from either the values or questions section
   - It locates comments from text entry questions
   - All data is normalized to a consistent format before processing

### Testing with Real Qualtrics Data

To test with a sample of real Qualtrics webhook data:

1. Use the simulator in interactive mode
2. Review the generated payload to understand the Qualtrics format
3. Verify that the integration service correctly processes the data
4. Check New Relic to confirm the event was published with all fields

### Qualtrics Webhook Format Reference

The Qualtrics webhook format includes:

```json
{
  "responseId": "R_AbCdEfGhIjKlM",
  "surveyId": "SV_12345678",
  "ownerId": "UR_AbCdEfGh",
  "responseDate": "2023-04-15T14:22:07Z",
  "values": {
    "startDate": "2023-04-15T14:20:00Z",
    "endDate": "2023-04-15T14:22:07Z",
    "status": "0",
    "progress": "100",
    "duration": 127,
    "finished": "1",
    "recordedDate": "2023-04-15T14:22:07Z",
    "_recordId": "R_AbCdEfGhIjKlM"
  },
  "labels": {},
  "questions": {
    "QID1": {
      "QuestionID": "QID1",
      "QuestionType": "NPS",
      "QuestionText": "How likely are you to recommend...",
      "Answers": {
        "Value": "9"
      }
    },
    "QID2": {
      "QuestionID": "QID2",
      "QuestionType": "TE",
      "QuestionText": "What is the reason for your score?",
      "Answers": {
        "Text": "Great product and support!"
      }
    }
  },
  "embeddedData": {
    "userId": "USER_12345",
    "sessionId": "SESSION_abcdef123456",
    "surveySource": "website"
  }
}
```

## Security Considerations

- HMAC validation is used to verify webhook authenticity
- All API keys are stored in environment variables, never in code
- Input validation is performed on all webhook data
- CSP headers are configured to allow New Relic Browser Agent

## Troubleshooting

- **Browser Agent Not Loading**: Verify your New Relic license key and app ID
- **Webhook Authentication Failing**: Check that the QUALTRICS_WEBHOOK_SECRET matches in both services
- **Events Not Appearing in New Relic**: Verify your Insert API Key and check the Integration Service logs

## License

This project is licensed under the MIT License - see the LICENSE file for details.