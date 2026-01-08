const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    maxRetries: 5,
    requestTimeout: 10000,
  },
  index: 'book-service-logs'
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'book-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length) {
            try {
              // Filter out circular references and non-serializable objects
              const safeMeta = {};
              for (const [key, value] of Object.entries(meta)) {
                if (key !== 'service' && value !== undefined && value !== null && 
                    typeof value !== 'function' && !key.startsWith('_')) {
                  if (typeof value === 'object' && value.constructor && value.constructor.name !== 'Object') {
                    safeMeta[key] = value.toString();
                  } else {
                    safeMeta[key] = value;
                  }
                }
              }
              if (Object.keys(safeMeta).length > 0) {
                metaStr = JSON.stringify(safeMeta, null, 2);
              }
            } catch (e) {
              metaStr = '[Object with circular reference]';
            }
          }
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    }),
    
    // File transport
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Add Elasticsearch transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new ElasticsearchTransport(esTransportOpts));
}

module.exports = { logger };
