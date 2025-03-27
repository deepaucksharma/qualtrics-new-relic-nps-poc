# Qualtrics-New Relic NPS Integration - Architecture Overview

## System Architecture

The Qualtrics-New Relic NPS Integration POC consists of three main components:

1. **Sample Web Application**
2. **Integration Service**
3. **Webhook Simulator** (POC only)

![Architecture Diagram](./images/architecture-diagram.png)

## Data Flow

1. **User Interaction & Browser Data**
   - User interacts with the Sample Web App
   - New Relic Browser Agent captures performance metrics, attaching `sessionId` automatically
   - Custom code sets `userId` using `newrelic.setUserId()`
   - Sample App retrieves and displays these identifiers

2. **NPS Feedback Path (Simulated)**
   - In a real implementation, user would complete a Qualtrics survey
   - In our POC, the Webhook Simulator generates a payload with the same `userId` and `sessionId`
   - Webhook Simulator signs the payload with HMAC using the shared secret

3. **Integration Service Processing**
   - Integration Service receives the webhook request
   - Authenticates via HMAC signature verification
   - Checks idempotency to prevent duplicate processing
   - Validates payload structure and data types
   - Calculates NPS category based on score
   - Transforms data to New Relic event format
   - Sends event to New Relic via Telemetry SDK

4. **Data Correlation in New Relic**
   - Both data sources (Browser Agent and NPS events) are stored in New Relic
   - Data can be correlated using the shared identifiers (`userId` and `sessionId`)
   - NRQL queries can join these datasets for analysis

## Component Architecture

### Sample Web Application

A simple web application instrumented with New Relic Browser Agent.

- **Technologies**: Node.js, Express.js, HTML/CSS/JavaScript
- **Key Functions**:
  - Load New Relic Browser Agent
  - Set custom `userId` using `newrelic.setUserId()`
  - Capture `sessionId` from Browser Agent via `sessionStorage`
  - Display these identifiers for testing purposes

### Integration Service

A backend service that processes webhook data from Qualtrics (simulated in the POC).

- **Technologies**: Node.js, Express.js, New Relic Telemetry SDK
- **Key Functions**:
  - Authenticate webhooks using HMAC-SHA256
  - Validate webhook payload structure and data
  - Ensure idempotency to prevent duplicate processing
  - Process NPS data (categorize scores)
  - Format and send events to New Relic

### Webhook Simulator (POC Only)

A utility to simulate Qualtrics webhook requests for testing.

- **Technologies**: Node.js, CLI tools
- **Key Functions**:
  - Generate webhook payloads with user-provided or random identifiers
  - Calculate HMAC signatures using the shared secret
  - Send HTTP requests to the Integration Service

## Security Architecture

- **HMAC Authentication**: Webhooks are signed using HMAC-SHA256 with a shared secret
- **Input Validation**: All webhook data is validated before processing
- **Idempotency**: Prevents duplicate processing of webhooks
- **Secret Management**: API keys and secrets are stored in environment variables

## Current Limitations

- **In-memory Idempotency**: Using a simple in-memory store for idempotency checks (not suitable for production)
- **Synchronous Processing**: Webhook processing is synchronous
- **No Persistent Storage**: No database for storing processed events
- **Limited Error Handling**: Basic error handling without retry mechanisms

## Production Recommendations

For a production implementation, consider:

- **Persistent Idempotency**: Use Redis, DynamoDB, or a database
- **Asynchronous Processing**: Implement message queues for resilience
- **Enhanced Security**: Add IP whitelisting, rate limiting
- **Scalability**: Run in containers with auto-scaling
- **Monitoring**: Add comprehensive logging and alerting
- **Resilience**: Implement retries, circuit breakers, and fallback mechanisms

## Project Structure

```
nps-poc/
├── docker-compose.yml        # Docker Compose configuration
├── .env.example              # Example environment variables
├── README.md                 # Project documentation
├── docs/                     # Additional documentation
│   ├── architecture.md       # This architecture overview
│   ├── api-spec.md           # API specifications
│   └── troubleshooting.md    # Troubleshooting guide
├── integration-service/      # Backend service for processing webhooks
│   ├── Dockerfile            # Container definition
│   ├── package.json          # Dependencies
│   ├── server.js             # Main application entry point
│   └── src/                  # Source code
│       ├── middleware/       # Express middleware
│       ├── services/         # Business logic
│       └── utils/            # Utility functions
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

## Future Enhancements

Additional features that could be implemented:

- **Persistent Storage**: Database for storing and querying NPS responses
- **Dashboard**: Web UI for visualizing NPS data
- **Advanced Analytics**: Correlation of NPS scores with performance metrics
- **Multi-tenant Support**: Support for multiple Qualtrics surveys and accounts
- **Webhook Verification**: Support for Qualtrics' webhook verification requests