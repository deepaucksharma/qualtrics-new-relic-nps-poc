# Qualtrics-New Relic NPS Integration - Troubleshooting Guide

## Common Issues and Solutions

### Sample Web Application

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

#### Session ID Not Being Captured

**Symptoms:**
- `sessionId` shows as "NOT_AVAILABLE"
- Browser Agent appears to load but no session data

**Solutions:**
1. Verify the Browser Agent version (should be 1217+)
2. Increase the delay before checking for sessionId (currently 500ms)
3. Check browser console for errors
4. Verify that sessionStorage is enabled in the browser

#### User ID Not Being Set

**Symptoms:**
- `userId` not appearing in New Relic events
- Issues with correlation queries

**Solutions:**
1. Verify the `newrelic.setUserId()` call is executed
2. Check browser console for errors
3. Ensure the call happens after the Browser Agent is fully loaded

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

### Enabling Debug Logging

Set the `LOG_LEVEL=debug` environment variable to increase logging detail.

## Getting Additional Help

If you're unable to resolve an issue using this guide:

1. Gather relevant logs from both the Sample App and Integration Service
2. Check the New Relic console for any errors or warnings
3. Document the exact steps to reproduce the issue
4. Contact your New Relic account representative or Qualtrics support team