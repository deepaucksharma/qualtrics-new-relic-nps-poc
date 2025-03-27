# Qualtrics-New Relic NPS Integration - Troubleshooting Guide

## Common Issues and Solutions

### Sample Web Application

#### JavaScript Not Loading

**Symptoms:**
- 404 errors for `/js/app.js` in browser console
- Tab navigation not working
- User interface elements non-responsive
- "Loading..." text remains on identity information

**Solutions:**
1. Verify the JavaScript file exists at `/sample-app/public/js/app.js`
2. Check if the HTML correctly references the JavaScript file
3. Make sure the server is properly serving static files from the public directory
4. If modifying the app, rebuild the container: `docker-compose build --no-cache sample-app`

#### Browser Agent Not Loading

**Symptoms:**
- No Browser Agent data in New Relic
- Console errors related to the New Relic script
- `sessionId` shows as "NOT_AVAILABLE"

**Solutions:**
1. Check if the New Relic Browser Agent script loads in the browser console
2. Verify `NEW_RELIC_LICENSE_KEY` and `NEW_RELIC_APP_ID` environment variables
3. Check network connectivity to New Relic domains
4. Ensure CSP headers allow New Relic scripts and connections
5. Check browser console for CORS or CSP-related errors

#### Session ID Not Being Captured

**Symptoms:**
- `sessionId` shows as "NOT_AVAILABLE"
- Browser Agent appears to load but no session data

**Solutions:**
1. Verify the Browser Agent version (should be 1217+)
2. Increase the delay before checking for sessionId (currently 500ms)
3. Check browser console for errors
4. Verify that sessionStorage is enabled in the browser
5. Try using the fallback mechanism by clicking directly on "Loading..."

#### User ID Not Being Set

**Symptoms:**
- `userId` not appearing in New Relic events
- Issues with correlation queries

**Solutions:**
1. Verify the `newrelic.setUserId()` call is executed
2. Check browser console for errors
3. Ensure the call happens after the Browser Agent is fully loaded
4. Check the fallback mechanism is working properly

### Integration Service

#### Webhook Authentication Failures

**Symptoms:**
- 401 Unauthorized responses
- "Invalid signature" errors in logs

**Solutions:**
1. Double-check the `QUALTRICS_WEBHOOK_SECRET` value matches on both sides
2. Ensure the signature is calculated on the exact same JSON string
   - Careful with whitespace, ordering of keys, etc.
3. Verify the signature header name is correct (`X-Qualtrics-Signature`)
4. Try the signature generator script to debug

#### Invalid Webhook Payload

**Symptoms:**
- 400 Bad Request responses
- Validation error messages

**Solutions:**
1. Check the webhook payload against the required schema
2. Ensure all required fields are present
3. Verify that `npsScoreRaw` is a valid value (0-10)
4. Check the format of any timestamps

#### New Relic Events Not Appearing

**Symptoms:**
- Webhooks processed successfully but no data in New Relic
- No correlation results in NRQL queries

**Solutions:**
1. Verify `NEW_RELIC_INSERT_KEY` is correct
2. Check Integration Service logs for Telemetry SDK errors
3. Allow enough time for data to appear (can take several minutes)
4. Verify account ID and regions match

#### Duplicate Webhook Processing

**Symptoms:**
- Same events appearing multiple times in New Relic

**Solutions:**
1. Check idempotency implementation
2. Verify unique `responseId` values for each webhook
3. Restart the service to clear the in-memory idempotency store

### UI Issues

#### Tabs Not Switching Correctly

**Symptoms:**
- Clicking on tabs doesn't change the content
- All content sections are visible at once
- Console errors related to undefined elements

**Solutions:**
1. Check that the JavaScript file is properly loaded
2. Verify the tab click handlers are being registered
3. Check for duplicate IDs or missing elements in the HTML
4. Inspect the browser console for JavaScript errors

#### Forms Not Submitting

**Symptoms:**
- Submit button has no effect
- No network requests when clicking submit
- No error messages

**Solutions:**
1. Check for JavaScript errors in the console
2. Verify the event listeners are properly attached
3. Check network conditions and connectivity to API endpoints
4. Try refreshing the page to reinitialize event handlers

#### Results Not Displaying

**Symptoms:**
- Results tab shows "No results yet" even after simulation
- Results not refreshing when tab is clicked

**Solutions:**
1. Check the API endpoint is returning results
2. Verify the results processing code is working
3. Make sure the results array is being populated in the Webhook Simulator
4. Try clicking "Refresh" button in the results tab

### Correlation Issues

#### Events Not Correlating in NRQL

**Symptoms:**
- NRQL queries return no results or partial results
- Unable to join PageView and NpsResponsePoc events

**Solutions:**
1. Verify both `userId` and `sessionId` match exactly between events
   - Note: This is case-sensitive
2. Check time windows in NRQL queries
3. Verify both event types exist in New Relic
4. Check for encoding or format issues in the identifiers

### Docker and Network Issues

#### Services Appear Unhealthy

**Symptoms:**
- Docker reports containers as "unhealthy" despite working endpoints
- Health checks not passing in Docker Compose

**Solutions:**
1. Wait for the services to initialize fully (can take up to a minute)
2. Verify that health check endpoints respond correctly
3. Check Docker logs for specific health check failures
4. Restart the containers if health checks continue to fail

#### Inter-Service Communication Failures

**Symptoms:**
- Communication between containers fails
- Services can't reach each other by hostname

**Solutions:**
1. Verify all services are on the same Docker network
2. Check Docker network configuration
3. Try using IP addresses instead of hostnames for debugging
4. Check for DNS resolution issues within the Docker network

## Diagnostic Procedures

### Testing Browser Agent Installation

Run the following code in the browser console:

```javascript
function diagnoseNewRelic() {
  console.log('New Relic object exists:', typeof window.newrelic !== 'undefined');
  
  if (window.newrelic) {
    console.log('New Relic methods:', Object.keys(window.newrelic)
      .filter(k => typeof window.newrelic[k] === 'function'));
    
    console.log('Session ID in storage:', window.sessionStorage.getItem('NRBA/SESSION_ID'));
    
    // Add diagnostic attribute
    window.newrelic.setCustomAttribute('diagnostic_check', 'true');
    console.log('Added diagnostic attribute');
  }
}

diagnoseNewRelic();
```

### Testing Client-Side JavaScript

Check if the JavaScript is loaded and functioning properly:

```javascript
function diagnoseAppJS() {
  // Check for presence of key function
  console.log('initSimulator exists:', typeof window.initSimulator === 'function');
  
  // Check event listeners
  const tabs = document.querySelectorAll('.tab');
  console.log('Tab elements found:', tabs.length > 0);
  
  const hasClickHandlers = Array.from(tabs).some(tab => 
    tab.onclick !== null || tab._events?.click);
  console.log('Tabs have click handlers:', hasClickHandlers);
  
  // Check structure
  console.log('Tab contents:', document.querySelectorAll('.tab-content').length);
}

diagnoseAppJS();
```

### Testing Webhook Endpoint

Use curl to test the webhook endpoint directly:

```bash
# Create a test payload
echo '{
  "responseId": "R_TEST_DIAGNOSTIC",
  "npsScoreRaw": "9",
  "userId": "TEST_USER_123",
  "sessionId": "test1234567890",
  "comment": "Diagnostic test"
}' > test_payload.json

# Generate signature
SECRET="your_webhook_secret"
SIGNATURE=$(openssl dgst -sha256 -hmac "$SECRET" test_payload.json | cut -d' ' -f2)

# Send the webhook
curl -X POST http://localhost:3001/webhook/qualtrics \
  -H "Content-Type: application/json" \
  -H "X-Qualtrics-Signature: $SIGNATURE" \
  -d @test_payload.json
```

### Verifying Events in New Relic

Run these NRQL queries to check for events:

```sql
-- Check for NPS events
SELECT count(*) FROM NpsResponsePoc SINCE 1 day ago

-- Check for specific test event
SELECT * FROM NpsResponsePoc WHERE qualtricsResponseId = 'R_TEST_DIAGNOSTIC' SINCE 1 day ago

-- Check for Browser events with matching sessionId
SELECT * FROM PageView WHERE sessionId = 'test1234567890' SINCE 1 day ago
```

## Logging Help

### Important Log Patterns

1. **Authentication Failures**:
   ```
   [auth-middleware] [R_12345] Authentication failed: Invalid signature
   ```

2. **Validation Errors**:
   ```
   [validation-middleware] [R_12345] Validation failed: Missing fields: userId, sessionId
   ```

3. **New Relic SDK Errors**:
   ```
   [event-publisher] [R_12345] Failed to send event to New Relic: Invalid API key
   ```

4. **JavaScript Loading Errors**:
   ```
   Failed to load resource: the server responded with a status of 404 (Not Found) http://localhost:3000/js/app.js
   ```

### Enabling Debug Logging

Set the `LOG_LEVEL=debug` environment variable to increase logging detail.

## Common Environment Issues

### Node.js Version Conflicts

**Symptoms:**
- Unexpected syntax errors for valid ES6+ code
- Module resolution issues
- Errors with newer JavaScript features

**Solutions:**
1. Verify Node.js versions in Docker containers (check Dockerfiles)
2. Ensure all services are using compatible versions
3. For local development, use Node.js 16+ 

### Environment Variables Missing or Incorrect

**Symptoms:**
- Services fail to start properly
- Error messages mentioning "undefined" keys or values
- Authentication failures

**Solutions:**
1. Confirm `.env` file exists and has all required variables
2. Verify values are formatted correctly (watch for extra spaces)
3. For Docker, ensure environment variables are passed to containers
4. Restart services after changing environment variables

### NRDB Verification Issues

#### Demo Mode When Expected Real Data

**Symptoms:**
- Message indicating "Demo data - New Relic API not configured"
- Data looks unrealistic or doesn't match expected values
- Results not matching what's visible in New Relic One

**Solutions:**
1. Configure `NEW_RELIC_USER_API_KEY` in your .env file
2. Check that `NEW_RELIC_ACCOUNT_ID` is correct
3. Verify that the API key has query permissions
4. Restart the sample app container after updating environment variables

#### NRQL Query Errors

**Symptoms:**
- Error message when executing a query
- Empty result set when data is expected
- NRQL syntax errors

**Solutions:**
1. Verify your NRQL query syntax is correct
2. Ensure you're querying the correct event type (`NpsResponsePoc`)
3. Check that the time range is appropriate
4. Simplify your query to diagnose specific issues
5. Test the query directly in New Relic One Query Builder first

#### No Data Visualization

**Symptoms:**
- Results table has data but chart is empty or not rendering
- Chart shows "No data available for visualization"
- Chart displays but looks incorrect

**Solutions:**
1. Make sure query returns appropriate data for the chart type
2. For score distribution, use a FACET query on npsScore
3. Check that data values are within expected ranges
4. Verify there are enough data points to visualize

#### Summary Metrics Issues

**Symptoms:**
- Summary metrics show zeroes or unexpected values
- NPS score calculation seems incorrect
- Metrics don't match table data

**Solutions:**
1. Verify that response data includes valid npsScore values
2. Check for sufficient data to calculate meaningful metrics
3. For custom queries, ensure they include all needed fields
4. Try using a predefined query template instead of custom query

## Getting Additional Help

If you're unable to resolve an issue using this guide:

1. Gather relevant logs from all services
2. Check the browser console for client-side errors
3. Document the exact steps to reproduce the issue
4. Create an issue in the GitHub repository with all collected information
5. Include any NRQL queries you're using and their results