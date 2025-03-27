# Qualtrics-New Relic NPS Integration POC

This project demonstrates the integration between Qualtrics NPS survey responses and New Relic Browser Agent data, enabling the correlation of user experience metrics with customer feedback. The POC includes tools to automatically generate realistic NPS data for testing and demonstration purposes.

## Architecture Overview

The POC consists of three main components:

1. **Sample Web Application**: A web app instrumented with New Relic Browser Agent that captures userId and sessionId. Includes an integrated dashboard for controlling simulations and viewing results.
2. **Integration Service**: A backend service that receives webhook data from Qualtrics, processes it, and forwards to New Relic.
3. **Webhook Simulator**: API and tools to simulate Qualtrics webhook requests in various modes (simple, random, and bulk).

## Data Flow

1. User interacts with Sample Web App
2. New Relic Browser Agent captures performance data and user identifiers
3. Sample App dashboard controls data generation and displays results
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
git clone https://github.com/deepaucksharma/qualtrics-new-relic-nps-poc.git
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
docker-compose up
```

This will start all three services:
- Sample Web App: http://localhost:3000
- Integration Service: http://localhost:3001
- Webhook Simulator API: http://localhost:3002

If you make changes to the code, you can rebuild the containers:

```bash
docker-compose build --no-cache
docker-compose up
```

#### Using npm scripts

A root package.json has been added with convenient scripts:

```bash
# Start everything using Docker Compose
npm start

# Stop all services
npm run stop

# Rebuild containers (if you make changes)
npm run rebuild

# Run individual services (for development)
npm run sample-app
npm run integration-service
npm run webhook-simulator
```

#### Running services individually (for development)

```bash
# Start Sample Web Application
cd sample-app
npm install
npm start

# In a new terminal, start Integration Service
cd integration-service
npm install
npm start

# In a new terminal, start the Webhook Simulator API
cd webhook-simulator
npm install
npm start
```

## Implementation Notes

### Mock New Relic Integration

For demonstration purposes, the Integration Service uses a mock implementation of the New Relic event publisher. In a production environment, you would need to:

1. Install the @newrelic/telemetry-sdk dependency
2. Replace the mock implementation in `integration-service/src/services/event-publisher.js` with the actual integration
3. Provide a valid New Relic Insert API Key in the .env file

### Browser Compatibility

The Sample Web Application is designed to run in a server environment and uses ES6 features. We've made sure that template literals and other ES6 syntax are properly handled in the server-side code to prevent parsing errors.

## Using the Sample App Interface

The sample app includes a comprehensive dashboard for controlling the webhook simulator and viewing results. Access it at http://localhost:3000.

### 1. Identity Information

The top section displays:
- User ID: Generated for the current user
- Session ID: Captured by the New Relic Browser Agent

### 2. Webhook Simulator Control Panel

The dashboard includes tabs for different simulation modes:

#### Simple Mode
- Send a single NPS response with a specified score and comment
- Useful for quick tests of individual responses

#### Random Mode
- Generate multiple responses with realistic score distribution
- Automatically creates contextual comments based on the score
- Select from 1, 5, 10, or 25 responses

#### Bulk Generation
- Create large datasets of NPS responses over time
- Configurable options:
  - Number of responses (25-500)
  - Time period to spread responses over (1-90 days)
  - Custom distribution percentages for Promoters/Passives/Detractors
- Useful for realistic data visualization in New Relic

#### Results
- View all simulation results with timing information
- Shows NPS score distribution charts for bulk generations
- Display comments and user information
- Refresh or clear results as needed

### 3. NRQL Query Examples

The dashboard includes sample NRQL queries you can use in New Relic to analyze the simulated data:
- View all NPS responses for the current user/session
- Calculate overall NPS score
- View NPS trends over time

## Command Line Webhook Simulators

In addition to the web interface, you can still use the command-line simulators:

### Qualtrics Format Simulator

```bash
cd webhook-simulator
npm run qualtrics
```

This interactive simulator creates webhooks that match real Qualtrics format:
- Proper Qualtrics response ID format
- Embedded data structure for userId and sessionId
- Question response format matching Qualtrics' schema
- HMAC signature generation
- Interactive and random data generation modes

### Bulk Data Generator

```bash
cd webhook-simulator
npm run bulk
```

This powerful tool generates large volumes of realistic NPS data:

```bash
# Run with default settings (100 responses over 30 days)
npm run bulk

# Generate 500 responses over 90 days
npm run bulk -- --count 500 --days 90 --send

# Generate 1000 responses and save to a file (without sending)
npm run bulk -- --count 1000 --output

# Control the rate of requests (500ms between each)
npm run bulk -- --count 200 --send --rate 500
```

Features:
- Realistic NPS score distribution (configurable percentages)
- Contextual comments based on score category
- Time distribution across specified period
- Varied user/session ID formats
- Detailed summary statistics

## Project Structure

```
qualtrics-new-relic-nps-poc/
├── package.json             # Root package.json with convenience scripts
├── docker-compose.yml       # Docker Compose configuration
├── .env.example             # Example environment variables
├── README.md                # Project documentation
├── docs/                    # Additional documentation
│   ├── architecture.md      # Architecture overview
│   ├── api-spec.md          # API specifications
│   └── troubleshooting.md   # Troubleshooting guide
├── integration-service/     # Backend service for processing webhooks
│   ├── Dockerfile           # Container definition
│   ├── package.json         # Dependencies
│   ├── server.js            # Main application entry point
│   └── src/                 # Source code
│       ├── services/
│       │   └── event-publisher.js  # Mock implementation of New Relic event publisher
├── sample-app/              # Sample web application with NR Browser Agent
│   ├── Dockerfile           # Container definition
│   ├── package.json         # Dependencies
│   └── app.js               # Application code with dashboard interface
└── webhook-simulator/       # Tools for simulating webhooks
    ├── Dockerfile           # Container definition
    ├── package.json         # Dependencies
    ├── server.js            # Webhook simulator API service
    ├── qualtrics-simulator.js # Interactive Qualtrics format simulator
    ├── generate-bulk-responses.js # Bulk data generator
    ├── send-payload.js      # Script to send test payloads
    └── simulate-webhook.js  # Simple interactive webhook simulator
```

## Data Generation Features

The webhook simulator includes several features to generate realistic NPS data:

### Realistic NPS Distribution

By default, the simulator generates scores with a distribution typically seen in real NPS surveys:
- Promoters (scores 9-10): ~35% of responses
- Passives (scores 7-8): ~25% of responses
- Detractors (scores 0-6): ~40% of responses

You can customize this distribution through the web interface or command-line options.

### Contextual Comments

Generated comments match the sentiment of the NPS score:
- Promoters get positive comments about reliability, satisfaction, etc.
- Passives get neutral comments mentioning both pros and cons
- Detractors get negative comments about issues, problems, etc.

### Time Distribution

When generating bulk data:
- Responses are spread evenly across your specified date range
- Each response gets a realistic timestamp
- You can analyze trends over time in New Relic

## Analyzing Data in New Relic

Once you've generated NPS data, you can create custom dashboards in New Relic:

### Basic Queries

```sql
-- Calculate NPS Score
SELECT 
  sum(CASE WHEN npsScore >= 9 THEN 1 ELSE 0 END) * 100.0 / count(*) - 
  sum(CASE WHEN npsScore <= 6 THEN 1 ELSE 0 END) * 100.0 / count(*) AS npsScore
FROM NpsResponsePoc SINCE 1 day ago

-- Distribution of scores
SELECT count(*) FROM NpsResponsePoc FACET npsScore SINCE 1 day ago

-- Distribution by category
SELECT count(*) FROM NpsResponsePoc FACET npsCategory SINCE 1 day ago
```

### Correlation Queries

```sql
-- Correlate NPS with page performance
SELECT 
  average(duration) AS 'Avg Page Load (ms)', 
  sum(CASE WHEN npsCategory = 'Promoter' THEN 1 ELSE 0 END) * 100.0 / count(*) AS 'Promoter %'
FROM PageView, NpsResponsePoc
WHERE PageView.session = NpsResponsePoc.sessionId
FACET PageView.pageUrl
SINCE 1 day ago
```

## Troubleshooting

### Common Issues:

- **Services Not Starting**: Check that ports 3000, 3001, and 3002 are not in use
- **Template Literal Errors**: If you see errors about unexpected tokens in the sample-app service, ensure you're using string concatenation instead of template literals in any server-side code
- **Integration Service Not Receiving Webhooks**: Verify network connectivity between containers
- **Events Not Appearing in New Relic**: Verify your Insert API Key and check the Integration Service logs
- **Missing Dependencies**: If you see errors about missing modules, try rebuilding the containers with `docker-compose build --no-cache`
- **Webhook Simulation Errors**: Check the results tab for detailed error information

## License

This project is licensed under the MIT License - see the LICENSE file for details.