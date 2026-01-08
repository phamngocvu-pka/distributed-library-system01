const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');

/**
 * @route   GET /health
 * @desc    Health check endpoint for service monitoring
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'book-service',
      checks: {
        mongodb: 'DOWN',
        redis: 'DOWN'
      }
    };

    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      health.checks.mongodb = 'UP';
    }

    // Check Redis connection
    try {
      const redis = await getRedisClient();
      const pong = await redis.ping();
      if (pong === 'PONG') {
        health.checks.redis = 'UP';
      }
    } catch (error) {
      health.checks.redis = 'DOWN';
    }

    // Overall status
    const allUp = Object.values(health.checks).every(status => status === 'UP');
    health.status = allUp ? 'UP' : 'DEGRADED';

    const statusCode = allUp ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /health/ready
 * @desc    Readiness check for Kubernetes
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  
  if (isReady) {
    res.status(200).json({ status: 'READY' });
  } else {
    res.status(503).json({ status: 'NOT_READY' });
  }
});

/**
 * @route   GET /health/live
 * @desc    Liveness check for Kubernetes
 * @access  Public
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'ALIVE' });
});

module.exports = router;
