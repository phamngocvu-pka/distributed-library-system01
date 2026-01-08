require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { registerService } = require('./config/consul');
const { initKafka } = require('./config/kafka');
const { initRabbitMQ } = require('./config/rabbitmq');
const { logger } = require('./utils/logger');
const { initMetrics, metricsMiddleware } = require('./utils/metrics');
const bookRoutes = require('./routes/book.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Metrics middleware
app.use(metricsMiddleware);

// Root route - API Documentation
app.get('/', (req, res) => {
  res.json({
    service: 'Book Service',
    version: '1.0.0',
    status: 'running',
    description: 'Distributed Library System - Book Management Microservice',
    endpoints: {
      health: {
        'GET /health': 'Health check endpoint'
      },
      books: {
        'GET /api/books': 'Get all books (with pagination)',
        'GET /api/books/available': 'Get available books',
        'GET /api/books/search?q=keyword': 'Search books',
        'GET /api/books/:id': 'Get book by ID',
        'POST /api/books': 'Create new book',
        'PUT /api/books/:id': 'Update book',
        'DELETE /api/books/:id': 'Delete book'
      },
      monitoring: {
        'GET /metrics': 'Prometheus metrics'
      }
    },
    documentation: '/api/docs',
    examples: {
      'Get all books': 'curl http://localhost:3001/api/books',
      'Health check': 'curl http://localhost:3001/health',
      'Search books': 'curl http://localhost:3001/api/books/search?q=distributed'
    },
    infrastructure: {
      database: 'MongoDB',
      cache: 'Redis',
      messaging: 'RabbitMQ + Kafka',
      discovery: 'Consul',
      monitoring: 'Prometheus + Grafana'
    }
  });
});

// Routes
app.use('/api/books', bookRoutes);
app.use('/health', healthRoutes);
app.get('/metrics', async (req, res) => {
  const { register } = require('prom-client');
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize all connections
async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✅ Connected to MongoDB');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Connected to Redis');

    // Initialize Kafka (non-blocking)
    try {
      await initKafka();
      logger.info('✅ Kafka initialized');
    } catch (kafkaError) {
      logger.warn('⚠️  Kafka initialization failed, continuing without Kafka:', kafkaError.message);
    }

    // Initialize RabbitMQ (non-blocking)
    try {
      await initRabbitMQ();
      logger.info('✅ RabbitMQ initialized');
    } catch (rmqError) {
      logger.warn('⚠️  RabbitMQ initialization failed, continuing without RabbitMQ:', rmqError.message);
    }

    // Initialize Prometheus metrics
    initMetrics();
    logger.info('✅ Metrics initialized');

    // Start server
    app.listen(PORT, async () => {
      logger.info(`🚀 Book Service running on port ${PORT}`);
      
      // Register with Consul (non-blocking)
      try {
        await registerService('book-service', PORT);
        logger.info('✅ Registered with Consul');
      } catch (consulError) {
        logger.warn('⚠️  Consul registration failed, continuing without service discovery:', consulError.message);
      }
    });

  } catch (error) {
    logger.error('❌ Failed to bootstrap Book Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

bootstrap();

module.exports = app;
