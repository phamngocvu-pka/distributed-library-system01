const CircuitBreaker = require('opossum');
const { logger } = require('./logger');

/**
 * Creates a circuit breaker for a given function
 * @param {Function} fn - The function to wrap with circuit breaker
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreaker}
 */
function createCircuitBreaker(fn, options = {}) {
  const defaultOptions = {
    timeout: 3000, // If function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 30000, // After 30 seconds, try again
    rollingCountTimeout: 10000, // Track failures over 10 second window
    rollingCountBuckets: 10, // Number of buckets for tracking
    name: options.name || 'unnamed-breaker'
  };

  const breakerOptions = { ...defaultOptions, ...options };
  const breaker = new CircuitBreaker(fn, breakerOptions);

  // Event listeners
  breaker.on('open', () => {
    logger.warn(`Circuit breaker ${breakerOptions.name} opened`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker ${breakerOptions.name} half-opened`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker ${breakerOptions.name} closed`);
  });

  breaker.on('failure', (error) => {
    logger.error(`Circuit breaker ${breakerOptions.name} failure:`, error);
  });

  breaker.fallback(() => {
    throw new Error(`Service temporarily unavailable: ${breakerOptions.name}`);
  });

  return breaker;
}

module.exports = { createCircuitBreaker };
