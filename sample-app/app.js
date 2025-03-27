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
  // Use static HTML file instead of generating dynamically
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get New Relic config
app.get('/api/config', (req, res) => {
  const config = {
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY || 'missing_license_key',
    applicationID: process.env.NEW_RELIC_APP_ID || 'missing_app_id',
    applicationName: process.env.NEW_RELIC_APP_NAME || 'NpsPocSampleApp'
  };
  res.json(config);
});

// Start the server
app.listen(PORT, () => {
  console.log('Sample Web Application running on port ' + PORT);
  console.log('Open http://localhost:' + PORT + ' in your browser');
});

module.exports = app; // Export for testing
