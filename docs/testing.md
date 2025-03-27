# Qualtrics-New Relic NPS Integration - Testing Guide

## Testing Strategy

The testing approach for the Qualtrics-New Relic NPS Integration POC includes several levels:

1. **Component Tests**: Tests for individual components
2. **Integration Tests**: Tests for component interactions
3. **End-to-End Tests**: Tests for the entire system flow

## Test Environment Setup

### Prerequisites

- Node.js 16+
- Sample App running on port 3000
- Integration Service running on port 3001
- Valid New Relic credentials
- Webhook secret configured

### Environment Variables

Create a `.env` file in the `/tests` directory:

```
SAMPLE_APP_URL=http://localhost:3000
INTEGRATION_SERVICE_URL=http://localhost:3001/webhook/qualtrics
QUALTRICS_WEBHOOK_SECRET=your_webhook_secret_here
NEW_RELIC_USER_API_KEY=your_user_api_key_here
NEW_RELIC_ACCOUNT_ID=your_account_id_here
```

## Test Cases

### Sample Web Application Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| SA-001 | Browser Agent Load | Open app in browser | Browser Agent loads successfully |
| SA-002 | User ID Setting | Open app in browser | userId is set and displayed |
| SA-003 | Session ID Capture | Open app in browser | sessionId is captured from sessionStorage |
| SA-004 | Survey Link Generation | Click "Generate" button | Link contains correct userId and sessionId |

### Integration Service Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| IS-001 | Valid Webhook | Send valid payload with correct signature | 200 OK, event processed |
| IS-002 | Invalid Signature | Send valid payload with incorrect signature | 401 Unauthorized |
| IS-003 | Missing Required Field | Send payload missing userId | 400 Bad Request |
| IS-004 | Invalid NPS Score | Send payload with npsScore=12 | 400 Bad Request |
| IS-005 | Duplicate Request | Send same payload twice | Second request returns 200 OK with "already processed" |
| IS-006 | NPS Category Calculation | Send payloads with scores 3, 7, 9 | Correct categories: Detractor, Passive, Promoter |

### End-to-End Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| E2E-001 | Full Flow | 1. Open Sample App<br>2. Capture userId/sessionId<br>3. Send webhook<br>4. Query New Relic | Correlated events found in New Relic |

## Running Tests

### End-to-End Test

```bash
cd tests
npm install
npm run test:e2e
```

### Manual Testing

#### Sample Web Application

1. Open http://localhost:3000 in your browser
2. Verify Browser Agent is loaded (check browser console)
3. Note the displayed userId and sessionId
4. Click "Generate Survey Link" to see the simulated link
5. Copy the webhook payload for testing

#### Webhook Testing with curl

```bash
# Replace values with your actual data
PAYLOAD='{"responseId":"R_TEST_123","npsScoreRaw":"9","userId":"POC_USER_123","sessionId":"a1b2c3d4e5f6g7h8","comment":"Test comment"}'
SECRET="your_webhook_secret"

# Calculate the HMAC signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Send the webhook
curl -X POST http://localhost:3001/webhook/qualtrics \
  -H "Content-Type: application/json" \
  -H "X-Qualtrics-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

#### Webhook Testing with Webhook Simulator

```bash
cd webhook-simulator
npm install
npm start
# Follow the prompts to create and send a webhook
```

## Verifying Test Results

### New Relic Verification

Run the following NRQL query in New Relic to verify data correlation:

```sql
SELECT filter(count(*), WHERE eventType() = 'PageView') as PageViews, 
       filter(count(*), WHERE eventType() = 'NpsResponsePoc') as NpsResponses, 
       latest(NpsResponsePoc.npsScore) as NpsScore, 
       latest(NpsResponsePoc.npsCategory) as NpsCategory
FROM PageView, NpsResponsePoc
WHERE sessionId = '[YOUR_SESSION_ID]'
AND userId = '[YOUR_USER_ID]'
SINCE 1 hour ago
```

Replace `[YOUR_SESSION_ID]` and `[YOUR_USER_ID]` with the values from your test.

### Expected Test Results

- PageViews > 0
- NpsResponses > 0
- NpsScore should match what you sent
- NpsCategory should be correct based on the score

## Troubleshooting Tests

### Common Issues

1. **Browser Agent Not Loading**
   - Check if `NEW_RELIC_LICENSE_KEY` is set correctly
   - Verify the script URL in the HTML is accessible

2. **Session ID Not Available**
   - Browser Agent may need more time to initialize
   - Check browser console for errors
   - Verify Browser Agent version is recent enough

3. **Webhook Authentication Failures**
   - Verify WEBHOOK_SECRET matches on sender and receiver
   - Check if the payload is exactly the same (no whitespace changes)
   - Ensure the header name is correct: `X-Qualtrics-Signature`

4. **New Relic Events Not Appearing**
   - Check Integration Service logs for errors
   - Verify `NEW_RELIC_INSERT_KEY` is correct
   - Allow enough time for data to appear in New Relic (can take minutes)