# Dashboard Verification Guide

This guide provides instructions for verifying that the New Relic dashboards are working correctly with the simulated NPS data from this POC.

## Prerequisites

Before attempting verification:

1. Make sure the POC is running and generating data:
   - Sample Web Application
   - Integration Service
   - Webhook Simulator

2. Generate a sufficient quantity of test data:
   - Run a bulk generation of at least 100 responses
   - Spread over at least 7 days
   - Include a mix of promoters, passives, and detractors

3. Have your New Relic account credentials ready

## Dashboard Import Verification

### Step 1: Import the Dashboard

1. Log in to New Relic One
2. Navigate to Dashboards
3. Click "Import Dashboard"
4. Paste the contents of `nps-browser-dashboard.json`
5. Click "Import"

**Expected Result**:
- Dashboard imports successfully
- Dashboard appears in your dashboards list
- No error messages during import

### Step 2: Check Dashboard Structure

Verify that the dashboard contains all expected pages and widgets:

1. **Overview Page**:
   - Overall NPS Score
   - NPS Response Distribution
   - NPS Score Trend
   - Page Load Time Distribution

2. **User Experience Correlations Page**:
   - Average Page Load by NPS Category
   - JavaScript Errors by NPS Category
   - Average First Paint by NPS Category
   - Load Time vs. NPS Score Correlation

3. **Page Performance Impact Page**:
   - Promoter % by Page
   - Detractor % by Page
   - Slowest Pages by Load Time

4. **User Segment Analysis Page**:
   - NPS Score by Browser
   - NPS Score by Device Type
   - NPS Score by Country

5. **Customer Comments Analysis Page**:
   - Common Words in Promoter Comments
   - Common Words in Detractor Comments
   - Recent Detractor Comments

**Expected Result**:
- All pages and widgets are present
- No "Widget failed to load" errors
- Correct layout and organization

## Data Verification

### Step 1: Basic Data Presence

1. Check the "Overall NPS Score" widget
   - Should display a numeric value (not "No Data")
   - Value should match your simulation distribution

2. Check the "NPS Response Distribution" pie chart
   - Should show segments for Promoters, Passives, and Detractors
   - Distribution should approximately match your simulation settings

3. Check the "NPS Score Trend" chart
   - Should show data points across the time period
   - Trend should reflect your simulation pattern

**Expected Result**:
- All widgets show data
- Values are reasonable and match expectations
- Time periods match your simulation time frame

### Step 2: Correlation Verification

The most important test is whether the NPS data correlates with Browser data.

1. Run a test with the Same Web Application:
   - Open the Sample Web App in your browser
   - Note the User ID and Session ID displayed
   - Send an NPS response with that User ID and Session ID
   - Use a distinctive comment for easy identification

2. Check the "Recent Detractor Comments" widget (if you sent a detractor score)
   - Look for your distinctive comment
   - Verify it appears with the correct score
   - Note the timestamp matches when you sent it

3. Run a raw NRQL query in New Relic:
```sql
SELECT *
FROM PageView, NpsResponsePoc
WHERE PageView.session = NpsResponsePoc.sessionId
AND NpsResponsePoc.userId = 'YOUR_TEST_USER_ID'
SINCE 1 day ago
```

**Expected Result**:
- The query returns results
- Both PageView and NpsResponsePoc data are present
- The session IDs match, showing correlation works

## Troubleshooting Verification Issues

### No Data Appears in Dashboard

1. **Check Event Types**:
   Run these queries to verify data exists:
   ```sql
   SELECT count(*) FROM NpsResponsePoc SINCE 7 days ago
   ```
   ```sql
   SELECT count(*) FROM PageView SINCE 7 days ago
   ```

2. **Check Field Names**:
   The dashboard assumes specific field names. Run this to verify:
   ```sql
   SELECT keys() FROM NpsResponsePoc SINCE 1 day ago LIMIT 1
   ```

3. **Check Time Window**:
   The dashboard uses a 30-day window by default. Ensure your data is within this window.

### Correlation Issues

1. **Check Field Formats**:
   The dashboard assumes sessionId is a string that matches Browser session. Verify with:
   ```sql
   SELECT sessionId FROM NpsResponsePoc LIMIT 10
   ```
   ```sql
   SELECT session FROM PageView LIMIT 10
   ```

2. **Verify Unique Sessions**:
   If there are too many sessions, correlation might be diluted:
   ```sql
   SELECT uniqueCount(sessionId) FROM NpsResponsePoc
   ```

3. **Check Browser Agent Configuration**:
   Ensure Browser Agent is capturing sessions correctly.

## Performance Considerations

Some dashboard widgets may be computationally expensive, especially:
- Word cloud widgets for comments
- Correlation queries that join multiple event types

If dashboard performance is slow:
- Consider reducing the time window (e.g., from 30 days to 7 days)
- Reduce the complexity of correlation queries
- Limit the number of facets in multi-facet queries

## Custom Visualization Verification

For more advanced verification:

1. **Create a Custom NPS Chart**:
   ```sql
   SELECT 
     count(*) as 'Responses',
     sum(CASE WHEN npsScore >= 9 THEN 1 ELSE 0 END) as 'Promoters',
     sum(CASE WHEN npsScore BETWEEN 7 AND 8 THEN 1 ELSE 0 END) as 'Passives',
     sum(CASE WHEN npsScore <= 6 THEN 1 ELSE 0 END) as 'Detractors',
     (sum(CASE WHEN npsScore >= 9 THEN 1 ELSE 0 END) * 100.0 / count(*) - 
      sum(CASE WHEN npsScore <= 6 THEN 1 ELSE 0 END) * 100.0 / count(*)) as 'NPS Score'
   FROM NpsResponsePoc 
   FACET hourOf(timestamp) 
   SINCE 24 hours ago
   ```

2. **Check Response Time Impact**:
   ```sql
   SELECT 
     average(duration) as 'Avg Response Time (ms)',
     npsScore
   FROM PageView, NpsResponsePoc
   WHERE PageView.session = NpsResponsePoc.sessionId
   FACET npsScore
   SINCE 7 days ago
   ```

3. **Verify Data Consistency**:
   Create multiple widgets using the same metric calculated different ways to ensure consistency.