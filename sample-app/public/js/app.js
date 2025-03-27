// Wait for New Relic Browser Agent to initialize (with timeout)
let newRelicTimeoutTimer;

// Configure New Relic from any existing configuration in the page
const nrConfigElement = document.getElementById('nrConfig');
if (nrConfigElement) {
  try {
    const config = JSON.parse(nrConfigElement.textContent);
    if (config) {
      window.NREUM = window.NREUM || {};
      window.NREUM.init = {
        licenseKey: config.licenseKey || '',
        applicationID: config.applicationID || '',
        applicationName: config.applicationName || ''
      };
      console.log('New Relic configuration loaded from page');
    }
  } catch (e) {
    console.error('Error parsing New Relic config:', e);
  }
}

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
      
      // Set query examples with proper IDs
      const queryUserIdElements = document.querySelectorAll('#query-user-id');
      queryUserIdElements.forEach(el => el.textContent = userId);
      
      const querySessionIdElements = document.querySelectorAll('#query-session-id');
      querySessionIdElements.forEach(el => el.textContent = sessionId);
      
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
  
  // Set query examples with proper IDs
  const queryUserIdElements = document.querySelectorAll('#query-user-id');
  queryUserIdElements.forEach(el => el.textContent = userId);
  
  const querySessionIdElements = document.querySelectorAll('#query-session-id');
  querySessionIdElements.forEach(el => el.textContent = sessionId);
  
  // Initialize the application
  initSimulator(userId, sessionId);
}

function initSimulator(userId, sessionId) {
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
      
      // Update NRQL query if verify tab
      if (tabId === 'verify') {
        updateNrqlQuery(userId, sessionId);
      }
    });
  });

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
  
  // Random mode has been removed
  
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

// NRDB Verification Tab Functionality
function updateNrqlQuery(userId, sessionId) {
  const queryType = document.getElementById('nrql-query-type').value;
  const queryTextArea = document.getElementById('nrql-query');
  const timeRange = document.getElementById('nrql-timerange').value;
  
  let query = '';
  
  switch (queryType) {
    case 'current-user':
      query = `SELECT * FROM NpsResponsePoc WHERE userId = '${userId}' SINCE ${timeRange} AGO LIMIT 100`;
      break;
    case 'overall-nps':
      query = `SELECT
  sum(CASE WHEN npsScore >= 9 THEN 1 ELSE 0 END) * 100.0 / count(*) - 
  sum(CASE WHEN npsScore <= 6 THEN 1 ELSE 0 END) * 100.0 / count(*) AS npsScore,
  sum(CASE WHEN npsScore >= 9 THEN 1 ELSE 0 END) AS promoters,
  sum(CASE WHEN npsScore BETWEEN 7 AND 8 THEN 1 ELSE 0 END) AS passives,
  sum(CASE WHEN npsScore <= 6 THEN 1 ELSE 0 END) AS detractors,
  count(*) AS totalResponses
FROM NpsResponsePoc SINCE ${timeRange} AGO`;
      break;
    case 'distribution':
      query = `SELECT count(*) FROM NpsResponsePoc FACET npsScore SINCE ${timeRange} AGO`;
      break;
    case 'custom':
      // Keep existing query
      return;
  }
  
  queryTextArea.value = query;
}

document.getElementById('nrql-query-type').addEventListener('change', function() {
  const userId = document.getElementById('userIdDisplay').textContent;
  const sessionId = document.getElementById('sessionIdDisplay').textContent;
  updateNrqlQuery(userId, sessionId);
});

document.getElementById('nrql-timerange').addEventListener('change', function() {
  const userId = document.getElementById('userIdDisplay').textContent;
  const sessionId = document.getElementById('sessionIdDisplay').textContent;
  updateNrqlQuery(userId, sessionId);
});

document.getElementById('query-nrdb').addEventListener('click', async function() {
  const query = document.getElementById('nrql-query').value;
  const timeRange = document.getElementById('nrql-timerange').value;
  const statusEl = document.getElementById('query-status');
  const noResultsEl = document.getElementById('nrdb-no-results');
  const resultContainerEl = document.getElementById('nrdb-result-container');
  
  statusEl.innerHTML = 'Querying New Relic... <div class="loading"></div>';
  statusEl.classList.remove('hidden', 'success-message', 'error-message');
  
  try {
    const response = await fetch('/api/query-nrdb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        timeRange
      })
    });
    
    const result = await response.json();
    
    if (result.success || result.demo) {
      statusEl.textContent = result.demo ? 'Demo data - New Relic API not configured' : 'Query successful';
      statusEl.classList.add(result.demo ? 'error-message' : 'success-message');
      
      // Show results container, hide no results message
      resultContainerEl.classList.remove('hidden');
      noResultsEl.classList.add('hidden');
      
      // Process and display the data
      const data = result.demo ? result.demoData : result.data;
      displayNrdbResults(data, query);
    } else {
      statusEl.textContent = 'Error: ' + (result.error || 'Unknown error');
      statusEl.classList.add('error-message');
      
      // Hide results container, show no results message
      resultContainerEl.classList.add('hidden');
      noResultsEl.classList.remove('hidden');
    }
  } catch (error) {
    statusEl.textContent = 'Error: ' + error.message;
    statusEl.classList.add('error-message');
    
    // Hide results container, show no results message
    resultContainerEl.classList.add('hidden');
    noResultsEl.classList.remove('hidden');
  }
});

function displayNrdbResults(data, query) {
  if (!data || data.length === 0) {
    document.getElementById('nrdb-result-container').classList.add('hidden');
    document.getElementById('nrdb-no-results').classList.remove('hidden');
    return;
  }
  
  // Update summary metrics
  updateNrdbSummary(data, query);
  
  // Update chart if applicable
  updateNrdbChart(data, query);
  
  // Display tabular data
  const tableHeaderEl = document.getElementById('nrdb-table-header');
  const tableBodyEl = document.getElementById('nrdb-table-body');
  
  // Clear existing content
  tableHeaderEl.innerHTML = '';
  tableBodyEl.innerHTML = '';
  
  // Get column names from first result
  const firstResult = data[0];
  const columns = Object.keys(firstResult);
  
  // Create header row
  const headerRow = document.createElement('tr');
  columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = column;
    headerRow.appendChild(th);
  });
  tableHeaderEl.appendChild(headerRow);
  
  // Create data rows
  data.forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(column => {
      const td = document.createElement('td');
      let cellValue = row[column];
      
      // Format special values
      if (column.toLowerCase().includes('timestamp') && typeof cellValue === 'string') {
        // Format timestamps
        try {
          const date = new Date(cellValue);
          cellValue = formatDate(date);
        } catch (e) {
          // Keep original if parsing fails
        }
      } else if (typeof cellValue === 'number' && column.toLowerCase().includes('score')) {
        // Format scores to 2 decimal places
        cellValue = cellValue.toFixed(2);
      } else if (typeof cellValue === 'object') {
        // Format objects as JSON
        cellValue = JSON.stringify(cellValue);
      }
      
      td.textContent = cellValue;
      tr.appendChild(td);
    });
    tableBodyEl.appendChild(tr);
  });
}

function updateNrdbSummary(data, query) {
  // Default values
  let totalResponses = 0;
  let npsScore = 0;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  
  // Determine the data type from the query and first result
  if (data.length > 0) {
    if (data[0].hasOwnProperty('totalResponses')) {
      // This is an overall summary result
      totalResponses = data[0].totalResponses || 0;
      npsScore = data[0].npsScore || 0;
      promoters = data[0].promoters || 0;
      passives = data[0].passives || 0;
      detractors = data[0].detractors || 0;
    } else if (data[0].hasOwnProperty('count')) {
      // This is distribution data (facet query)
      totalResponses = data.reduce((sum, item) => sum + (item.count || 0), 0);
      
      // Calculate NPS metrics from distribution
      promoters = data
        .filter(item => item.npsScore >= 9)
        .reduce((sum, item) => sum + item.count, 0);
        
      passives = data
        .filter(item => item.npsScore >= 7 && item.npsScore <= 8)
        .reduce((sum, item) => sum + item.count, 0);
        
      detractors = data
        .filter(item => item.npsScore <= 6)
        .reduce((sum, item) => sum + item.count, 0);
        
      npsScore = Math.round(((promoters - detractors) / totalResponses) * 100);
    } else {
      // This is individual response data
      totalResponses = data.length;
      
      // Count categories
      data.forEach(item => {
        if (item.npsScore >= 9 || item.npsCategory === 'Promoter') {
          promoters++;
        } else if ((item.npsScore >= 7 && item.npsScore <= 8) || item.npsCategory === 'Passive') {
          passives++;
        } else {
          detractors++;
        }
      });
      
      // Calculate NPS score
      npsScore = Math.round(((promoters - detractors) / totalResponses) * 100);
    }
  }
  
  // Update UI
  document.getElementById('nrdb-total-responses').textContent = totalResponses;
  document.getElementById('nrdb-nps-score').textContent = npsScore;
  document.getElementById('nrdb-promoters').textContent = promoters;
  document.getElementById('nrdb-passives').textContent = passives;
  document.getElementById('nrdb-detractors').textContent = detractors;
}

function updateNrdbChart(data, query) {
  const chartContainer = document.getElementById('nrdb-chart-container');
  
  // Determine if we have distribution data (facet query)
  const isDistribution = data.length > 0 && data[0].hasOwnProperty('npsScore') && data[0].hasOwnProperty('count');
  
  if (isDistribution) {
    // For simplicity, just create a bar chart using divs
    chartContainer.innerHTML = '';
    
    // Find the maximum count for scaling
    const maxCount = Math.max(...data.map(item => item.count));
    
    // Container for the chart
    const chart = document.createElement('div');
    chart.style.display = 'flex';
    chart.style.alignItems = 'flex-end';
    chart.style.height = '180px';
    chart.style.width = '100%';
    chart.style.gap = '4px';
    
    // Create bars for each score
    // Make sure data is sorted by npsScore
    const sortedData = [...data].sort((a, b) => a.npsScore - b.npsScore);
    
    sortedData.forEach(item => {
      const barContainer = document.createElement('div');
      barContainer.style.display = 'flex';
      barContainer.style.flexDirection = 'column';
      barContainer.style.alignItems = 'center';
      barContainer.style.flex = '1';
      
      const bar = document.createElement('div');
      const height = (item.count / maxCount) * 150;
      
      bar.style.width = '100%';
      bar.style.height = `${height}px`;
      bar.style.backgroundColor = getScoreColor(item.npsScore);
      bar.style.borderRadius = '3px 3px 0 0';
      
      const label = document.createElement('div');
      label.style.marginTop = '5px';
      label.textContent = item.npsScore;
      label.style.fontSize = '12px';
      
      const count = document.createElement('div');
      count.style.marginTop = '2px';
      count.textContent = item.count;
      count.style.fontSize = '10px';
      count.style.color = '#666';
      
      barContainer.appendChild(bar);
      barContainer.appendChild(label);
      barContainer.appendChild(count);
      
      chart.appendChild(barContainer);
    });
    
    chartContainer.appendChild(chart);
  } else {
    // For other data types, show a category bar
    const totalResponses = parseInt(document.getElementById('nrdb-total-responses').textContent) || 0;
    const promoters = parseInt(document.getElementById('nrdb-promoters').textContent) || 0;
    const passives = parseInt(document.getElementById('nrdb-passives').textContent) || 0;
    const detractors = parseInt(document.getElementById('nrdb-detractors').textContent) || 0;
    
    if (totalResponses > 0) {
      const promoterPercent = Math.round((promoters / totalResponses) * 100);
      const passivePercent = Math.round((passives / totalResponses) * 100);
      const detractorPercent = Math.round((detractors / totalResponses) * 100);
      
      chartContainer.innerHTML = `
        <div class="nps-chart">
          <div class="nps-segment nps-detractors" style="width: ${detractorPercent}%;">${detractorPercent}%</div>
          <div class="nps-segment nps-passives" style="width: ${passivePercent}%;">${passivePercent}%</div>
          <div class="nps-segment nps-promoters" style="width: ${promoterPercent}%;">${promoterPercent}%</div>
        </div>
      `;
    } else {
      chartContainer.innerHTML = '<p>No data available for visualization</p>';
    }
  }
}

function getScoreColor(score) {
  if (score >= 9) {
    return '#28a745'; // Promoter - green
  } else if (score >= 7) {
    return '#ffc107'; // Passive - yellow
  } else {
    return '#dc3545'; // Detractor - red
  }
}

// Fallback if script completely fails to execute
window.addEventListener('load', function() {
  setTimeout(function() {
    if (document.getElementById('userIdDisplay').textContent === 'Loading...') {
      console.warn('Triggering fallback initialization after page load');
      initializeFallback();
    }
  }, 5000); // 5 second additional safety net
});
