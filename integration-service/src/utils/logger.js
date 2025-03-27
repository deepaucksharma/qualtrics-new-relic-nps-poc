// Logging utility
const winston = require('winston');
const { format, transports } = winston;

/**
 * Creates a configured logger instance
 * @param {string} service Name of the service/module
 * @returns {winston.Logger} Configured logger
 */
function createLogger(service) {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Format for development (colorized, readable)
  const developmentFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length 
        ? `\n${JSON.stringify(meta, null, 2)}` 
        : '';
      return `${timestamp} [${service}] ${level}: ${message}${metaString}`;
    })
  );
  
  // Format for production (JSON)
  const productionFormat = format.combine(
    format.timestamp(),
    format.json()
  );
  
  return winston.createLogger({
    level: logLevel,
    format: isDevelopment ? developmentFormat : productionFormat,
    defaultMeta: { service },
    transports: [
      new transports.Console()
    ]
  });
}

module.exports = { createLogger };