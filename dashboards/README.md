# New Relic Dashboards for NPS & Browser Experience

This directory contains sample dashboard definitions that can be imported into New Relic to visualize the correlation between NPS survey responses and Browser performance data.

## Dashboard Descriptions

### NPS & Browser Experience Dashboard

A comprehensive dashboard showing the relationship between user experience metrics and NPS scores. The dashboard includes:

1. **Overview Page**
   - Overall NPS Score
   - NPS Response Distribution (Promoters, Passives, Detractors)
   - NPS Score Trend over time
   - Page Load Time Distribution

2. **User Experience Correlations Page**
   - Average Page Load by NPS Category
   - JavaScript Errors by NPS Category
   - Average First Paint by NPS Category
   - Load Time vs. NPS Score Correlation

3. **Page Performance Impact Page**
   - Promoter % by Page
   - Detractor % by Page
   - Slowest Pages with NPS Impact

4. **User Segment Analysis Page**
   - NPS Score by Browser
   - NPS Score by Device Type
   - NPS Score by Country

5. **Customer Comments Analysis Page**
   - Word clouds for Promoter and Detractor comments
   - Recent Detractor Comments

## How to Import Dashboards

To import the dashboard into your New Relic account:

1. Go to New Relic One
2. Navigate to Dashboards
3. Click "Import Dashboard"
4. Paste the contents of the JSON file
5. Click "Import"

## Customization

The NRQL queries in the dashboard assume:

- NPS data is stored in an event type called `NpsResponsePoc`
- NPS scores are in a field named `npsScore`
- NPS categories are in a field named `npsCategory` with values "Promoter", "Passive", and "Detractor"
- Comments are stored in a field named `comment`
- Each NPS response has a `sessionId` that correlates with the `session` attribute in Browser events

You may need to modify the queries if your data structure differs from these assumptions.

## Extending the Dashboards

You can extend these dashboards by:

1. Adding widgets for specific business KPIs
2. Creating filters for different time periods
3. Adding alerts for negative trends
4. Breaking down results by user segments important to your business

## Additional Resources

- [New Relic Dashboard Documentation](https://docs.newrelic.com/docs/query-your-data/explore-query-data/dashboards/introduction-dashboards/)
- [NRQL Query Syntax](https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/get-started/introduction-nrql-new-relics-query-language/)
- [Browser Monitoring in New Relic](https://docs.newrelic.com/docs/browser/browser-monitoring/getting-started/introduction-browser-monitoring/)