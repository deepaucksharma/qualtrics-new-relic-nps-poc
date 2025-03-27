# NPS & Browser Experience Dashboard Preview

Below is a preview of what the dashboard will look like when implemented in New Relic.

## Overview Page

This page provides a high-level summary of NPS scores and performance metrics.

```
+-----------------------------------+-----------------------------------+
|                                   |                                   |
|        Overall NPS Score          |       NPS Response Distribution   |
|                                   |                                   |
|             +42                   |    [PIE CHART: Promoters 35%,     |
|                                   |     Passives 25%, Detractors 40%] |
|                                   |                                   |
+-----------------------------------+-----------------------------------+
|                                                                       |
|                      NPS Score Trend (12 weeks)                       |
|                                                                       |
|    [LINE CHART: Weekly NPS scores over time, showing improvements]    |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|                   Page Load Time Distribution                         |
|                                                                       |
|    [HISTOGRAM: Distribution of page load times from 0-4000ms]         |
|                                                                       |
+-----------------------------------------------------------------------+
```

## User Experience Correlations Page

This page shows how performance metrics correlate with NPS categories.

```
+-----------------------------------+-----------------------------------+
|                                   |                                   |
|   Average Page Load by NPS        |    JavaScript Errors by NPS       |
|                                   |                                   |
|  [BAR CHART:                      |   [BAR CHART:                     |
|   Promoters: 1.2s                 |    Promoters: 0.2                 |
|   Passives: 2.1s                  |    Passives: 0.5                  |
|   Detractors: 3.5s]               |    Detractors: 1.8]               |
|                                   |                                   |
+-----------------------------------+-----------------------------------+
|                                   |                                   |
|  Average First Paint by NPS       |   Load Time vs. NPS Score         |
|                                   |                                   |
|  [BAR CHART:                      |  [SCATTER PLOT:                   |
|   Promoters: 0.8s                 |   Points showing negative         |
|   Passives: 1.5s                  |   correlation between load        |
|   Detractors: 2.3s]               |   time and NPS scores]            |
|                                   |                                   |
+-----------------------------------+-----------------------------------+
```

## Page Performance Impact Page

This page shows which pages have the biggest impact on NPS scores.

```
+-----------------------------------+-----------------------------------+
|                                   |                                   |
|      Promoter % by Page           |      Detractor % by Page          |
|                                   |                                   |
|  [BAR CHART:                      |  [BAR CHART:                      |
|   Homepage: 45%                   |   Checkout: 62%                   |
|   Product: 38%                    |   Cart: 48%                       |
|   Account: 32%                    |   Search: 39%                     |
|   ...]                            |   ...]                            |
|                                   |                                   |
+-----------------------------------+-----------------------------------+
|                                                                       |
|                    Slowest Pages by Load Time                         |
|                                                                       |
|  [TABLE:                                                              |
|   Page URL | Avg Load Time | Page Views | Detractor %                 |
|   /checkout | 4.2s        | 12,345     | 62%                         |
|   /search   | 3.8s        | 45,678     | 39%                         |
|   /cart     | 3.5s        | 23,456     | 48%                         |
|   ...]                                                                |
|                                                                       |
+-----------------------------------------------------------------------+
```

## User Segment Analysis Page

This page breaks down NPS scores by different user segments.

```
+-----------------------------------+-----------------------------------+
|                                   |                                   |
|     NPS Score by Browser          |     NPS Score by Device Type      |
|                                   |                                   |
|  [COLUMN CHART:                   |  [COLUMN CHART:                   |
|   Chrome: +45                     |   Desktop: +52                    |
|   Firefox: +38                    |   Tablet: +28                     |
|   Safari: +42                     |   Mobile: +15                     |
|   Edge: +37                       |   Other: +31]                     |
|   IE: -15]                        |                                   |
|                                   |                                   |
+-----------------------------------+-----------------------------------+
|                                                                       |
|                      NPS Score by Country                             |
|                                                                       |
|  [COLUMN CHART:                                                       |
|   USA: +45, Canada: +48, UK: +41, Germany: +39, France: +36,          |
|   Australia: +44, Japan: +32, Brazil: +38, India: +29, Other: +34]    |
|                                                                       |
+-----------------------------------------------------------------------+
```

## Customer Comments Analysis Page

This page provides insight into customer feedback through comment analysis.

```
+-----------------------------------+-----------------------------------+
|                                   |                                   |
|  Common Words in Promoter Comments|  Common Words in Detractor Comments|
|                                   |                                   |
|  [WORD CLOUD:                     |  [WORD CLOUD:                     |
|   Larger: great, easy, love,      |   Larger: slow, error, difficult, |
|   intuitive, fast                 |   frustrating, confusing          |
|   Smaller: helpful, simple,       |   Smaller: problems, issues,      |
|   awesome, convenient, ...]       |   broken, complicated, ...]       |
|                                   |                                   |
+-----------------------------------+-----------------------------------+
|                                                                       |
|                     Recent Detractor Comments                         |
|                                                                       |
|  [TABLE:                                                              |
|   Timestamp | Score | Comment                           | User ID     |
|   2025-03-25| 3     | "Page kept freezing during..."   | USER_1234   |
|   2025-03-24| 2     | "Checkout process is too slow..." | USER_5678  |
|   2025-03-23| 0     | "Could not complete my purchase..."| USER_9012 |
|   ...]                                                                |
|                                                                       |
+-----------------------------------------------------------------------+
```

## Dashboard Value

This dashboard enables you to:

1. **Identify Performance Issues** - See which performance metrics have the strongest correlation with low NPS scores
2. **Prioritize Improvements** - Focus on pages with high detractor rates
3. **Segment Analysis** - Understand which user segments are having the best/worst experiences
4. **Track Progress** - Monitor how NPS scores improve as you enhance performance
5. **Understand Customer Sentiment** - Analyze comment themes to identify specific issues

By connecting performance data with NPS feedback, you can make data-driven decisions about where to focus your optimization efforts for maximum customer satisfaction impact.