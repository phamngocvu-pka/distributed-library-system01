const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');

let kafka = null;
let producer = null;
let consumer = null;

async function initKafka() {
  try {
    kafka = new Kafka({
      clientId: 'book-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9093'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    // Initialize producer
    producer = kafka.producer();
    await producer.connect();
    logger.info('Kafka producer connected');

    // Initialize consumer
    consumer = kafka.consumer({ groupId: 'book-service-group' });
    await consumer.connect();
    logger.info('Kafka consumer connected');

    // Subscribe to topics
    await consumer.subscribe({ topic: 'book-events', fromBeginning: false });
    await consumer.subscribe({ topic: 'library-events', fromBeginning: false });

    // Start consuming
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          logger.info(`Received Kafka message from topic ${topic}:`, event);
          
          // Handle different event types
          await handleKafkaEvent(topic, event);
        } catch (error) {
          logger.error('Error processing Kafka message:', error);
        }
      },
    });

  } catch (error) {
    logger.error('Failed to initialize Kafka:', error);
    throw error;
  }
}

async function publishEvent(topic, event) {
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: event.id || Date.now().toString(),
          value: JSON.stringify(event),
          headers: {
            'event-type': event.type,
            'timestamp': Date.now().toString()
          }
        }
      ]
    });
    logger.info(`Event published to Kafka topic ${topic}:`, event.type);
  } catch (error) {
    logger.error('Failed to publish Kafka event:', error);
    throw error;
  }
}

async function handleKafkaEvent(topic, event) {
  switch (event.type) {
    case 'BOOK_BORROWED':
      logger.info(`Book ${event.bookId} was borrowed by user ${event.userId}`);
      // Update book availability
      break;
    case 'BOOK_RETURNED':
      logger.info(`Book ${event.bookId} was returned by user ${event.userId}`);
      // Update book availability
      break;
    default:
      logger.warn(`Unknown event type: ${event.type}`);
  }
}

async function disconnectKafka() {
  try {
    if (producer) await producer.disconnect();
    if (consumer) await consumer.disconnect();
    logger.info('Kafka disconnected');
  } catch (error) {
    logger.error('Error disconnecting Kafka:', error);
  }
}

module.exports = {
  initKafka,
  publishEvent,
  disconnectKafka
};
