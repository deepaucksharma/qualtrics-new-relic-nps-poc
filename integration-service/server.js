// Integration Service for Qualtrics-New Relic NPS Integration POC
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { createLogger } = require('./src/utils/logger');
const errorHandler = require('./src/utils/error-handler');
const authenticate = require('./src/middleware/authenticate');
const checkIdempotency = require('./src/middleware/idempotency');
const validatePayload = require('./src/middleware/validate');
const processNps = require('./src/services/nps-processor');
const publishEvent = require('./src/services/event-publisher');

const app = express();
const PORT = process.env.PORT || 3001;
const logger = createLogger('integration-service');

// Security middleware
app.use(helmet());

// Parse JSON payloads
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Webhook endpoint with middleware pipeline
app.post('/webhook/qualtrics', 
  authenticate,
  checkIdempotency,
  validatePayload,
  processNps,
  publishEvent
);

// Error handling middleware
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Integration Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app; // Export for testing