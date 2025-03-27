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
