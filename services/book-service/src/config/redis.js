const Redis = require('ioredis');
const Redlock = require('redlock').default || require('redlock');
const { logger } = require('../utils/logger');

let redisClient = null;
let redlock = null;

async function connectRedis() {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    // Initialize Redlock for distributed locking
    try {
      redlock = new Redlock([redisClient], {
        driftFactor: 0.01,
        retryCount: 10,
        retryDelay: 200,
        retryJitter: 200,
        automaticExtensionThreshold: 500,
      });

      redlock.on('error', (err) => {
        logger.error('Redlock error:', err);
      });
    } catch (redlockError) {
      logger.warn('Redlock initialization failed, continuing without distributed locking:', redlockError.message);
      redlock = null;
    }

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

async function getRedisClient() {
  if (!redisClient) {
    await connectRedis();
  }
  return redisClient;
}

function getRedlock() {
  return redlock;
}

// Cache helper functions
async function cacheGet(key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

async function cacheSet(key, value, ttl = 3600) {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

async function cacheDel(key) {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  getRedlock,
  cacheGet,
  cacheSet,
  cacheDel
};
