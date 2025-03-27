# Dashboard Installation Guide

## Prerequisites

Before importing the dashboard, ensure:

1. You have New Relic NPS POC data flowing into your New Relic account
2. Your New Relic Browser Agent is properly configured and capturing data
3. You have sufficient permissions to create dashboards in your New Relic account

## Installation Steps

### Method 1: Using the New Relic UI

1. **Access New Relic One**
   - Log in to New Relic One at https://one.newrelic.com
   
2. **Navigate to Dashboards**
   - Click on "Dashboards" in the top navigation

3. **Import Dashboard**
   - Click on the "Import dashboard" button (typically in the upper right)

4. **Paste JSON Definition**
   - Copy the entire contents of the `nps-browser-dashboard.json` file
   - Paste into the import dialog
   - Click "Import dashboard"

5. **Customize (Optional)**
   - After importing, you can customize the dashboard by:
     - Editing widget titles and descriptions
     - Modifying NRQL queries to match your data structure
     - Adjusting time ranges
     - Adding or removing widgets

### Method 2: Using the New Relic API

You can also programmatically create the dashboard using the New Relic API:

```bash
curl -X POST https://api.newrelic.com/graphql \
  -H 'Content-Type: application/json' \
  -H 'API-Key: YOUR_USER_API_KEY' \
  -d '{
    "query": "mutation { dashboardCreate(accountId: YOUR_ACCOUNT_ID, dashboard: { ... dashboard JSON ... }) { entityResult { guid name } errors { description } } }"
  }'
```

Replace:
- `YOUR_USER_API_KEY` with your New Relic User API key
- `YOUR_ACCOUNT_ID` with your New Relic account ID
- `... dashboard JSON ...` with the formatted dashboard JSON (the API format differs slightly from the UI import format)

## Troubleshooting

### Common Issues:

1. **No Data Appears in Widgets**
   - Verify your NPS data is being collected correctly
   - Check that event names and attribute names match those in the NRQL queries
   - Adjust the time window to ensure it covers periods with data

2. **Correlation Widgets Show No Results**
   - Ensure both Browser Agent and NPS data contain matching session IDs
   - Verify that the `sessionId` in NPS data matches the `session` attribute in Browser data

3. **Error During Import**
   - Check the JSON format for errors
   - Ensure you have the correct permissions in New Relic

## Support

If you encounter issues with the dashboard:

1. Check the [New Relic Documentation](https://docs.newrelic.com/)
2. Review the [New Relic Community Forum](https://discuss.newrelic.com/)
3. Submit an issue in the GitHub repository

## Customization Resources

For advanced dashboard customization, consult:

- [New Relic Dashboard API](https://docs.newrelic.com/docs/apis/nerdgraph/examples/nerdgraph-dashboards-api-tutorials/)
- [NRQL Query Examples](https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/nrql-query-examples/nrql-examples-advanced-techniques/)