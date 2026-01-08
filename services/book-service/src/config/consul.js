const Consul = require('consul');
const { logger } = require('../utils/logger');

let consulClient = null;

function getConsulClient() {
  if (!consulClient) {
    consulClient = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || 8500,
      promisify: true
    });
  }
  return consulClient;
}

async function registerService(serviceName, port) {
  const consul = getConsulClient();
  
  const serviceId = `${serviceName}-${process.env.HOSTNAME || 'local'}-${port}`;
  const serviceHost = process.env.SERVICE_HOST || 'book-service';
  
  const serviceDefinition = {
    id: serviceId,
    name: serviceName,
    address: serviceHost,
    port: parseInt(port, 10), // Ensure port is integer
    check: {
      http: `http://${serviceHost}:${port}/health`,
      interval: '10s',
      timeout: '5s',
      deregistercriticalserviceafter: '1m'
    },
    tags: ['microservice', 'library-system']
  };

  try {
    await consul.agent.service.register(serviceDefinition);
    logger.info(`Service ${serviceName} registered with Consul (ID: ${serviceId})`);
    
    // Handle graceful shutdown
    const deregister = async () => {
      try {
        await consul.agent.service.deregister(serviceId);
        logger.info(`Service ${serviceName} deregistered from Consul`);
      } catch (error) {
        logger.error('Failed to deregister service:', error);
      }
    };

    process.on('SIGTERM', deregister);
    process.on('SIGINT', deregister);
    
  } catch (error) {
    logger.error('Failed to register service with Consul:', error);
    throw error;
  }
}

async function discoverService(serviceName) {
  const consul = getConsulClient();
  
  try {
    const result = await consul.health.service({ service: serviceName, passing: true });
    
    if (result && result.length > 0) {
      // Simple round-robin load balancing
      const randomIndex = Math.floor(Math.random() * result.length);
      const service = result[randomIndex];
      
      return {
        address: service.Service.Address,
        port: service.Service.Port,
        url: `http://${service.Service.Address}:${service.Service.Port}`
      };
    }
    
    throw new Error(`No healthy instances found for service: ${serviceName}`);
  } catch (error) {
    logger.error(`Failed to discover service ${serviceName}:`, error);
    throw error;
  }
}

module.exports = {
  getConsulClient,
  registerService,
  discoverService
};
