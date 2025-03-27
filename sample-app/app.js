// Sample Web Application for Qualtrics-New Relic NPS Integration POC
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SIMULATOR_URL = process.env.WEBHOOK_SIMULATOR_URL || 'http://webhook-simulator:3002';

// Security middleware - CSP configured to allow New Relic
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js-agent.newrelic.com"],
      connectSrc: ["'self'", "https://bam.nr-data.net", WEBHOOK_SIMULATOR_URL],
      imgSrc: ["'self'", "data:"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// Parse JSON requests
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes for proxy to webhook simulator
app.post('/api/simulate/simple', async (req, res) => {
  try {
    const response = await axios.post(WEBHOOK_SIMULATOR_URL + '/simulate/simple', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error simulating simple webhook:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data
    });
  }
});

app.post('/api/simulate/random', async (req, res) => {
  try {
    const response = await axios.post(WEBHOOK_SIMULATOR_URL + '/simulate/random', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error simulating random webhook:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data
    });
  }
});

app.post('/api/simulate/bulk', async (req, res) => {
  try {
    const response = await axios.post(WEBHOOK_SIMULATOR_URL + '/simulate/bulk', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error simulating bulk webhooks:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data
    });
  }
});

app.get('/api/results', async (req, res) => {
  try {
    const response = await axios.get(WEBHOOK_SIMULATOR_URL + '/results');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching results:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/results/clear', async (req, res) => {
  try {
    const response = await axios.post(WEBHOOK_SIMULATOR_URL + '/results/clear');
    res.json(response.data);
  } catch (error) {
    console.error('Error clearing results:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Main route
app.get('/', (req, res) => {
  // Pass New Relic config to template
  const config = {
    NR_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY || 'missing_license_key',
    NR_APP_ID: process.env.NEW_RELIC_APP_ID || 'missing_app_id',
    NR_APP_NAME: process.env.NEW_RELIC_APP_NAME || 'NpsPocSampleApp',
    WEBHOOK_SIMULATOR_URL: WEBHOOK_SIMULATOR_URL
  };
  
  // Generate HTML with config values
  const html = generateHtml(config);
  res.send(html);
});

// Start the server
app.listen(PORT, () => {
  console.log('Sample Web Application running on port ' + PORT);
  console.log('Open http://localhost:' + PORT + ' in your browser');
});

// HTML template generator
function generateHtml(config) {
  // Ensure config values are properly escaped for JavaScript
  const safeConfig = {
    NR_LICENSE_KEY: (config.NR_LICENSE_KEY || 'missing_license_key').replace(/"/g, '\\"'),
    NR_APP_ID: (config.NR_APP_ID || 'missing_app_id').replace(/"/g, '\\"'),
    NR_APP_NAME: (config.NR_APP_NAME || 'NpsPocSampleApp').replace(/"/g, '\\"'),
    WEBHOOK_SIMULATOR_URL: (config.WEBHOOK_SIMULATOR_URL || 'http://localhost:3002').replace(/"/g, '\\"')
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Qualtrics-New Relic NPS Integration POC</title>
  
  <!-- New Relic Browser Agent -->
  <script type="text/javascript">
    // Initialize New Relic with error handling
    try {
      window.NREUM||(NREUM={});NREUM.init={
        licenseKey:"${safeConfig.NR_LICENSE_KEY}",
        applicationID:"${safeConfig.NR_APP_ID}",
        applicationName:"${safeConfig.NR_APP_NAME}"
      };
      console.log('New Relic configuration initialized');
    } catch (e) {
      console.error('Error initializing New Relic config:', e);
    }
  </script>
  <script src="https://js-agent.newrelic.com/nr-1234.min.js" onerror="console.error('Failed to load New Relic script')"></script>
  
  <style>
    /* Base styles with high browser compatibility */
    body { 
      font-family: Arial, sans-serif; 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 20px; 
      line-height: 1.6;
    }
    .container { 
      background: #f5f5f5; 
      padding: 20px; 
      border-radius: 5px; 
      margin: 20px 0; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .id-display { 
      background: #e0e0e0; 
      padding: 10px; 
      border-radius: 3px; 
      font-family: monospace;
      word-break: break-all;
    }
    button { 
      background: #0066cc; 
      color: white; 
      border: none; 
      padding: 10px 15px; 
      cursor: pointer; 
      border-radius: 3px;
      font-weight: bold;
      margin-right: 5px;
      margin-bottom: 5px;
    }
    button:hover {
      background: #0055aa;
    }
    button:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }
    .danger-button {
      background: #cc0000;
    }
    .danger-button:hover {
      background: #aa0000;
    }
    input, select {
      padding: 8px;
      margin: 5px 0;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid #ccc;
      margin-bottom: 20px;
    }
    .tab {
      padding: 10px 15px;
      cursor: pointer;
      border: 1px solid transparent;
      border-bottom: none;
      margin-right: 5px;
      border-radius: 5px 5px 0 0;
    }
    .tab.active {
      background: #f5f5f5;
      border-color: #ccc;
      font-weight: bold;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .results-container {
      max-height: 500px;
      overflow-y: auto;
    }
    .result-item {
      border: 1px solid #eee;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 3px;
    }
    .result-item.success {
      border-left: 5px solid green;
    }
    .result-item.error {
      border-left: 5px solid red;
    }
    .result-item.summary {
      border-left: 5px solid blue;
      background-color: #f0f8ff;
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .result-time {
      font-size: 0.8em;
      color: #666;
    }
    .result-label {
      display: inline-block;
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 0.8em;
      margin-right: 5px;
    }
    .label-promoter {
      background-color: #d4f7d4;
      color: #007700;
    }
    .label-passive {
      background-color: #fff7d4;
      color: #777700;
    }
    .label-detractor {
      background-color: #f7d4d4;
      color: #770000;
    }
    .label-type {
      background-color: #d4e6f7;
      color: #000077;
    }
    .nps-chart {
      display: flex;
      margin: 10px 0;
      height: 25px;
    }
    .nps-segment {
      text-align: center;
      color: white;
      line-height: 25px;
      font-size: 0.9em;
    }
    .nps-promoters {
      background-color: #28a745;
    }
    .nps-passives {
      background-color: #ffc107;
    }
    .nps-detractors {
      background-color: #dc3545;
    }
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      border-top-color: #0066cc;
      animation: spin 1s linear infinite;
      margin-left: 10px;
      vertical-align: middle;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .hidden {
      display: none;
    }
    #surveyLink { 
      margin-top: 15px; 
      word-break: break-all; 
    }
    pre {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 3px;
      overflow-x: auto;
    }
    .success-message {
      color: green;
      margin-left: 10px;
    }
    .error-message {
      color: red;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <h1>Qualtrics-New Relic NPS Integration POC</h1>
  
  <div class="container">
    <h2>Identity Information</h2>
    <p>This information will be used to correlate Browser data with NPS responses:</p>
    
    <div class="id-display">
      <p><strong>User ID:</strong> <span id="userIdDisplay">Loading...</span>
        <noscript>
          <span style="color: #cc0000;"> JavaScript required to generate user ID</span>
        </noscript>
      </p>
      <p><strong>Session ID:</strong> <span id="sessionIdDisplay">Loading...</span>
        <noscript>
          <span style="color: #cc0000;"> JavaScript required to capture session ID</span>
        </noscript>
      </p>
    </div>
    <noscript>
      <div style="color: #cc0000; background: #ffe6e6; padding: 10px; border: 1px solid #cc0000; margin-top: 10px;">
        <strong>Warning:</strong> JavaScript is required for this application to function properly.
        Please enable JavaScript in your browser settings and reload the page.
      </div>
    </noscript>
  </div>
  
  <div class="container">
    <h2>Webhook Simulator Control Panel</h2>
    <p>Use this panel to generate and send simulated Qualtrics NPS data to New Relic:</p>
    
    <div class="tabs">
      <div class="tab active" data-tab="simple">Simple Mode</div>
      <div class="tab" data-tab="random">Random Mode</div>
      <div class="tab" data-tab="bulk">Bulk Generation</div>
      <div class="tab" data-tab="results">Results</div>
    </div>
    
    <div class="tab-content active" id="simple-tab">
      <p>Send a single NPS response with specified values:</p>
      <div class="form-group">
        <label for="simple-score">NPS Score (0-10):</label>
        <input type="number" id="simple-score" min="0" max="10" value="9">
      </div>
      <div class="form-group">
        <label for="simple-comment">Comment:</label>
        <input type="text" id="simple-comment" value="Great product, very useful!" style="width: 80%;">
      </div>
      <button id="send-simple">Send NPS Response</button>
      <span id="simple-status" class="success-message hidden"></span>
    </div>
    
    <div class="tab-content" id="random-tab">
      <p>Generate responses with realistic score distribution and appropriate comments:</p>
      <div class="form-group">
        <label for="random-count">Number of responses:</label>
        <select id="random-count">
          <option value="1">1 response</option>
          <option value="5">5 responses</option>
          <option value="10">10 responses</option>
          <option value="25">25 responses</option>
        </select>
      </div>
      <button id="send-random">Generate Random Responses</button>
      <span id="random-status" class="success-message hidden"></span>
    </div>
    
    <div class="tab-content" id="bulk-tab">
      <p>Generate a large dataset of NPS responses over time with realistic distribution:</p>
      <div class="form-group">
        <label for="bulk-count">Number of responses:</label>
        <select id="bulk-count">
          <option value="25">25 responses</option>
          <option value="50">50 responses</option>
          <option value="100">100 responses</option>
          <option value="250">250 responses</option>
          <option value="500">500 responses</option>
        </select>
      </div>
      <div class="form-group">
        <label for="bulk-days">Spread over days:</label>
        <select id="bulk-days">
          <option value="1">1 day</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
      </div>
      <div class="form-group">
        <label>NPS Distribution:</label>
        <div style="display: flex;">
          <div style="margin-right: 20px;">
            <label for="promoter-percent">Promoters (%):</label>
            <input type="number" id="promoter-percent" min="0" max="100" value="35" style="width: 60px;">
          </div>
          <div style="margin-right: 20px;">
            <label for="passive-percent">Passives (%):</label>
            <input type="number" id="passive-percent" min="0" max="100" value="25" style="width: 60px;">
          </div>
          <div>
            <label for="detractor-percent">Detractors (%):</label>
            <input type="number" id="detractor-percent" min="0" max="100" value="40" style="width: 60px;">
          </div>
        </div>
      </div>
      <button id="send-bulk">Start Bulk Generation</button>
      <span id="bulk-status" class="hidden"></span>
      <div id="bulk-progress" class="hidden" style="margin-top: 10px;">
        <p>Bulk generation in progress. This may take a while for large datasets.</p>
        <p>Check the Results tab to monitor progress.</p>
      </div>
    </div>
    
    <div class="tab-content" id="results-tab">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0;">Simulation Results</h3>
        <div>
          <button id="refresh-results">Refresh</button>
          <button id="clear-results" class="danger-button">Clear All</button>
        </div>
      </div>
      <div id="results-container" class="results-container">
        <p id="no-results">No results yet. Run a simulation to see results here.</p>
      </div>
    </div>
  </div>

  <div class="container">
    <h2>NRQL Query Examples</h2>
    <p>Use these queries in New Relic to analyze your NPS data:</p>
    <pre>-- View all NPS responses for current user/session
SELECT *
FROM NpsResponsePoc
WHERE userId = '<span id="query-user-id">Loading...</span>'
AND sessionId = '<span id="query-session-id">Loading...</span>'
SINCE 1 day ago</pre>

<pre>-- Calculate overall NPS score
SELECT 
  sum(CASE WHEN npsScore >= 9 THEN 1 ELSE 0 END) * 100.0 / count(*) - 
  sum(CASE WHEN npsScore <= 6 THEN 1 ELSE 0 END) * 100.0 / count(*) AS npsScore,
  sum(CASE WHEN npsScore >= 9 THEN 1 ELSE 0 END) AS promoters,
  sum(CASE WHEN npsScore BETWEEN 7 AND 8 THEN 1 ELSE 0 END) AS passives,
  sum(CASE WHEN npsScore <= 6 THEN 1 ELSE 0 END) AS detractors,
  count(*) AS totalResponses
FROM NpsResponsePoc
SINCE 1 day ago</pre>

<pre>-- View NPS trend over time
SELECT 
  sum(CASE WHEN npsScore >= 9 THEN 1 ELSE 0 END) * 100.0 / count(*) - 
  sum(CASE WHEN npsScore <= 6 THEN 1 ELSE 0 END) * 100.0 / count(*) AS npsScore
FROM NpsResponsePoc
FACET hourOf(timestamp) 
SINCE 1 day ago</pre>
  </div>

  <script>
    // Wait for New Relic Browser Agent to initialize (with timeout)
    let newRelicTimeoutTimer;
    
    function waitForNewRelic() {
      // Set a timeout to avoid waiting indefinitely
      if (!newRelicTimeoutTimer) {
        newRelicTimeoutTimer = setTimeout(() => {
          console.warn('New Relic Browser Agent did not load within timeout period');
          initializeFallback();
        }, 3000); // Wait max 3 seconds
      }
      
      if (window.NREUM && window.NREUM.loaded) {
        clearTimeout(newRelicTimeoutTimer);
        initializeWithNewRelic();
      } else if (window.NREUM) {
        // New Relic exists but not fully loaded, keep waiting
        setTimeout(waitForNewRelic, 100);
      } else {
        // No New Relic detected at all, check a few more times
        if (window.newRelicRetries === undefined) {
          window.newRelicRetries = 0;
        }
        
        window.newRelicRetries++;
        
        if (window.newRelicRetries > 10) {
          clearTimeout(newRelicTimeoutTimer);
          console.warn('New Relic Browser Agent not detected after multiple retries');
          initializeFallback();
        } else {
          setTimeout(waitForNewRelic, 100);
        }
      }
    }

    function initializeWithNewRelic() {
      console.log('New Relic Browser Agent initialized');
      
      try {
        // Set user ID
        const userId = "POC_USER_" + Math.floor(Math.random() * 10000);
        
        // Only call New Relic API if available
        if (window.newrelic && typeof window.newrelic.setUserId === 'function') {
          window.newrelic.setUserId(userId);
          console.log('Set User ID in New Relic:', userId);
        } else {
          console.warn('New Relic setUserId method not available');
        }
        
        document.getElementById('userIdDisplay').textContent = userId;
        
        // Get session ID (may need a short delay for the agent to set it)
        setTimeout(() => {
          let sessionId = 'NOT_AVAILABLE';
          
          try {
            // Try to get New Relic session ID
            sessionId = window.sessionStorage.getItem('NRBA/SESSION_ID') || 'NOT_AVAILABLE';
            console.log('Captured Session ID:', sessionId);
          } catch (error) {
            console.warn('Error getting session ID:', error);
            sessionId = 'ERROR_GETTING_SESSION_ID';
          }
          
          document.getElementById('sessionIdDisplay').textContent = sessionId;
          document.getElementById('query-user-id').textContent = userId;
          document.getElementById('query-session-id').textContent = sessionId;
          
          // Initialize the application
          initSimulator(userId, sessionId);
        }, 500);
      } catch (error) {
        console.error('Error during New Relic initialization:', error);
        initializeFallback();
      }
    }
    
    function initializeFallback() {
      console.log('Using fallback initialization without New Relic');
      
      // Generate fallback IDs
      const userId = "POC_USER_FALLBACK_" + Math.floor(Math.random() * 10000);
      const sessionId = "FALLBACK_SESSION_" + new Date().getTime();
      
      document.getElementById('userIdDisplay').textContent = userId;
      document.getElementById('sessionIdDisplay').textContent = sessionId;
      document.getElementById('query-user-id').textContent = userId;
      document.getElementById('query-session-id').textContent = sessionId;
      
      // Initialize the application
      initSimulator(userId, sessionId);
    }
      
      // Set up tabs
      const tabs = document.querySelectorAll('.tab');
      const tabContents = document.querySelectorAll('.tab-content');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabId = tab.getAttribute('data-tab');
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update active content
          tabContents.forEach(content => content.classList.remove('active'));
          document.getElementById(tabId + '-tab').classList.add('active');
          
          // Refresh results if results tab
          if (tabId === 'results') {
            fetchResults();
          }
        });
      });
    }
    
    function initSimulator(userId, sessionId) {
      // Set up simple mode
      document.getElementById('send-simple').addEventListener('click', async () => {
        const simpleScore = document.getElementById('simple-score').value;
        const simpleComment = document.getElementById('simple-comment').value;
        const statusEl = document.getElementById('simple-status');
        
        // Validate score
        if (simpleScore < 0 || simpleScore > 10) {
          showMessage(statusEl, 'Error: Score must be between 0 and 10', 'error');
          return;
        }
        
        statusEl.innerHTML = 'Sending... <div class="loading"></div>';
        statusEl.classList.remove('hidden', 'success-message', 'error-message');
        
        try {
          const response = await fetch('/api/simulate/simple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              sessionId,
              npsScore: parseInt(simpleScore),
              comment: simpleComment
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            showMessage(statusEl, 'Response sent successfully!', 'success');
          } else {
            showMessage(statusEl, 'Error: ' + (result.error || 'Unknown error'), 'error');
          }
        } catch (error) {
          showMessage(statusEl, 'Error: ' + error.message, 'error');
        }
      });
      
      // Set up random mode
      document.getElementById('send-random').addEventListener('click', async () => {
        const randomCount = parseInt(document.getElementById('random-count').value);
        const statusEl = document.getElementById('random-status');
        
        statusEl.innerHTML = 'Sending ' + randomCount + ' random responses... <div class="loading"></div>';
        statusEl.classList.remove('hidden', 'success-message', 'error-message');
        
        try {
          const response = await fetch('/api/simulate/random', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              sessionId,
              count: randomCount
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            showMessage(statusEl, result.count + ' responses sent successfully!', 'success');
          } else {
            showMessage(statusEl, 'Error: ' + (result.error || 'Unknown error'), 'error');
          }
        } catch (error) {
          showMessage(statusEl, 'Error: ' + error.message, 'error');
        }
      });
      
      // Set up bulk mode
      document.getElementById('send-bulk').addEventListener('click', async () => {
        const bulkCount = parseInt(document.getElementById('bulk-count').value);
        const bulkDays = parseInt(document.getElementById('bulk-days').value);
        const promoterPercent = parseInt(document.getElementById('promoter-percent').value);
        const passivePercent = parseInt(document.getElementById('passive-percent').value);
        const detractorPercent = parseInt(document.getElementById('detractor-percent').value);
        
        const statusEl = document.getElementById('bulk-status');
        const progressEl = document.getElementById('bulk-progress');
        
        // Validate percentages
        const totalPercent = promoterPercent + passivePercent + detractorPercent;
        if (totalPercent !== 100) {
          showMessage(statusEl, 'Error: Percentages must add up to 100, got ' + totalPercent, 'error');
          return;
        }
        
        statusEl.innerHTML = 'Starting bulk generation... <div class="loading"></div>';
        statusEl.classList.remove('hidden', 'success-message', 'error-message');
        progressEl.classList.add('hidden');
        
        try {
          const response = await fetch('/api/simulate/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              sessionId,
              count: bulkCount,
              daysSpread: bulkDays,
              promoterPercent,
              passivePercent,
              detractorPercent
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            showMessage(statusEl, result.message, 'success');
            progressEl.classList.remove('hidden');
            
            // Switch to results tab after a delay
            setTimeout(() => {
              document.querySelector('.tab[data-tab="results"]').click();
            }, 2000);
          } else {
            showMessage(statusEl, 'Error: ' + (result.error || 'Unknown error'), 'error');
          }
        } catch (error) {
          showMessage(statusEl, 'Error: ' + error.message, 'error');
        }
      });
      
      // Set up results management
      document.getElementById('refresh-results').addEventListener('click', fetchResults);
      
      document.getElementById('clear-results').addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all results?')) {
          try {
            await fetch('/api/results/clear', { method: 'POST' });
            fetchResults();
          } catch (error) {
            console.error('Error clearing results:', error);
          }
        }
      });
      
      // Initial results fetch
      fetchResults();
      
      // Setup NPS distribution percentage validation
      ['promoter-percent', 'passive-percent', 'detractor-percent'].forEach(id => {
        document.getElementById(id).addEventListener('input', validateNpsPercentages);
      });
    }
    
    function validateNpsPercentages() {
      const promoterPercent = parseInt(document.getElementById('promoter-percent').value) || 0;
      const passivePercent = parseInt(document.getElementById('passive-percent').value) || 0;
      const detractorPercent = parseInt(document.getElementById('detractor-percent').value) || 0;
      
      const total = promoterPercent + passivePercent + detractorPercent;
      
      const bulkButton = document.getElementById('send-bulk');
      if (total !== 100) {
        bulkButton.disabled = true;
        bulkButton.title = 'Percentages must add up to 100, current total: ' + total;
      } else {
        bulkButton.disabled = false;
        bulkButton.title = '';
      }
    }
    
    async function fetchResults() {
      const resultsContainer = document.getElementById('results-container');
      const noResultsEl = document.getElementById('no-results');
      
      try {
        const response = await fetch('/api/results');
        const results = await response.json();
        
        if (results.length === 0) {
          noResultsEl.style.display = 'block';
          resultsContainer.innerHTML = '';
          resultsContainer.appendChild(noResultsEl);
          return;
        }
        
        noResultsEl.style.display = 'none';
        resultsContainer.innerHTML = '';
        
        // Process and display results
        results.forEach(result => {
          const resultEl = document.createElement('div');
          resultEl.className = 'result-item ' + (result.success ? 'success' : 'error');
          
          // Special handling for summary results
          if (result.type === 'bulk-summary') {
            resultEl.className = 'result-item summary';
            
            // Calculate NPS chart segment widths
            const promoters = result.percentages.promoters;
            const passives = result.percentages.passives;
            const detractors = result.percentages.detractors;
            
            resultEl.innerHTML = 
              '<div class="result-header">' +
                '<strong>Bulk Generation Summary</strong>' +
                '<span class="result-time">' + formatDate(new Date(result.timestamp)) + '</span>' +
              '</div>' +
              '<div>' +
                '<p>Generated ' + result.totalCount + ' responses over ' + result.daysSpread + ' days (' + result.successful + ' successful, ' + result.failed + ' failed)</p>' +
                '<p>NPS Score: ' + result.npsScore + ' (Promoters: ' + promoters + '%, Passives: ' + passives + '%, Detractors: ' + detractors + '%)</p>' +
                '<div class="nps-chart">' +
                  '<div class="nps-segment nps-detractors" style="width: ' + detractors + '%;">' + detractors + '%</div>' +
                  '<div class="nps-segment nps-passives" style="width: ' + passives + '%;">' + passives + '%</div>' +
                  '<div class="nps-segment nps-promoters" style="width: ' + promoters + '%;">' + promoters + '%</div>' +
                '</div>' +
              '</div>';
          } else if (result.payload) {
            // For regular results with payload
            const score = parseInt(result.payload.values?.npsScoreRaw || result.payload.npsScoreRaw || 0);
            const category = score >= 9 ? 'promoter' : (score >= 7 ? 'passive' : 'detractor');
            const userId = result.payload.embeddedData?.userId || result.payload.userId;
            const comment = result.payload.questions?.QID2?.Answers?.Text || result.payload.comment || '';
            
            resultEl.innerHTML = 
              '<div class="result-header">' +
                '<div>' +
                  '<span class="result-label label-type">' + (result.type || 'unknown') + '</span>' +
                  '<span class="result-label label-' + category + '">Score: ' + score + '</span>' +
                  '<strong>User: ' + userId + '</strong>' +
                '</div>' +
                '<span class="result-time">' + formatDate(new Date(result.timestamp)) + '</span>' +
              '</div>' +
              '<div>' +
                '<p>' + (comment || 'No comment provided') + '</p>' +
              '</div>';
          } else {
            // Fallback for other result types
            resultEl.innerHTML = 
              '<div class="result-header">' +
                '<strong>' + (result.type || 'Response') + '</strong>' +
                '<span class="result-time">' + formatDate(new Date(result.timestamp)) + '</span>' +
              '</div>' +
              '<div>' +
                '<p>' + (result.success ? 'Success' : 'Error: ' + (result.error || 'Unknown error')) + '</p>' +
              '</div>';
          }
          
          resultsContainer.appendChild(resultEl);
        });
      } catch (error) {
        console.error('Error fetching results:', error);
        resultsContainer.innerHTML = '<p class="error-message">Error loading results: ' + error.message + '</p>';
      }
    }
    
    function formatDate(date) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    }
    
    function showMessage(element, message, type = 'success') {
      element.textContent = message;
      element.classList.remove('hidden');
      
      if (type === 'success') {
        element.classList.add('success-message');
        element.classList.remove('error-message');
      } else {
        element.classList.add('error-message');
        element.classList.remove('success-message');
      }
      
      // Auto-hide after a few seconds
      setTimeout(() => {
        element.classList.add('hidden');
      }, 5000);
    }
    
    // Start the process
    waitForNewRelic();
    
    // Fallback if script completely fails to execute
    window.addEventListener('load', function() {
      setTimeout(function() {
        if (document.getElementById('userIdDisplay').textContent === 'Loading...') {
          console.warn('Triggering fallback initialization after page load');
          initializeFallback();
        }
      }, 5000); // 5 second additional safety net
    });
  </script>
</body>
</html>`;
}

module.exports = app; // Export for testing