# Qualtrics-New Relic NPS Integration - API Specification

## Webhook API

The Integration Service exposes a webhook endpoint to receive NPS data.

### Endpoint

```
POST /webhook/qualtrics
```

### Headers

| Header                | Description                                   | Required |
|-----------------------|-----------------------------------------------|----------|
| Content-Type          | Must be `application/json`                    | Yes      |
| X-Qualtrics-Signature | HMAC-SHA256 signature of the request payload  | Yes      |

### Request Payload Schema

```json
{
  "responseId": "string",      // Unique identifier for the survey response
  "npsScoreRaw": "string",     // NPS score as a string (0-10)
  "userId": "string",          // User identifier matching Browser Agent
  "sessionId": "string",       // Session identifier matching Browser Agent
  "comment": "string",         // Optional: User's qualitative feedback
  "surveySource": "string",    // Optional: Source of the survey
  "responseTimestamp": "number" // Optional: Time of response (Unix epoch ms)
}
```

### Example Request

```
POST /webhook/qualtrics
Content-Type: application/json
X-Qualtrics-Signature: 5a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1

{
  "responseId": "R_1a2b3c4d5e6f7g8h",
  "npsScoreRaw": "9",
  "userId": "POC_USER_123",
  "sessionId": "a1b2c3d4e5f6g7h8",
  "comment": "Great product, highly recommended!",
  "surveySource": "in-app",
  "responseTimestamp": 1679834096789
}
```

### Response Codes

| Status Code | Description                          |
|-------------|--------------------------------------|
| 200         | Successfully processed               |
| 400         | Invalid payload (validation failed)  |
| 401         | Authentication failed                |
| 5xx         | Server error                         |

### Success Response

```json
{
  "status": "processed"
}
```

### Error Response

```json
{
  "error": "Error message",
  "fields": ["field1", "field2"]  // Only for validation errors
}
```

## New Relic Event Structure

The Integration Service sends events to New Relic with the following structure:

```json
{
  "eventType": "NpsResponsePoc",
  "qualtricsResponseId": "string",   // From input responseId
  "userId": "string",                 // From input userId
  "sessionId": "string",              // From input sessionId
  "npsScore": "number",               // Parsed numeric score (0-10)
  "npsCategory": "string",            // "Detractor", "Passive", or "Promoter"
  "npsComment": "string",             // Optional: From input comment
  "surveySource": "string",           // Optional: From input surveySource
  "responseTimestamp": "number",      // Parsed from input or generated (Unix epoch ms)
  "receivedTimestamp": "number"       // When the webhook was received (Unix epoch ms)
}
```

## Health Check Endpoint

```
GET /health
```

### Response

```json
{
  "status": "ok"
}
```

## NRQL Query Examples

### Basic Correlation Query

```sql
SELECT filter(count(*), WHERE eventType() = 'PageView') as PageViews, 
       filter(count(*), WHERE eventType() = 'NpsResponsePoc') as NpsResponses, 
       latest(NpsResponsePoc.npsScore) as NpsScore, 
       latest(NpsResponsePoc.npsCategory) as NpsCategory
FROM PageView, NpsResponsePoc
WHERE sessionId = '[SESSION_ID]'
AND userId = '[USER_ID]'
SINCE 1 hour ago
```

### NPS by Category

```sql
SELECT count(*) FROM NpsResponsePoc FACET npsCategory SINCE 1 week ago
```

### NPS Score vs Page Load Time

```sql
SELECT latest(npsScore) as 'NPS Score', 
       latest(duration) as 'Page Load Time (ms)' 
FROM NpsResponsePoc, PageView 
WHERE NpsResponsePoc.sessionId = PageView.sessionId 
AND NpsResponsePoc.userId = PageView.userId
FACET NpsResponsePoc.sessionId
SINCE 1 week ago
LIMIT 200