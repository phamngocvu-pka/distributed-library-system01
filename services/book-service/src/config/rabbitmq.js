const amqp = require('amqplib');
const { logger } = require('../utils/logger');

let connection = null;
let channel = null;

async function initRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    // Create exchanges
    await channel.assertExchange('library.events', 'topic', { durable: true });
    await channel.assertExchange('library.direct', 'direct', { durable: true });

    // Create queues
    await channel.assertQueue('book.notifications', { durable: true });
    await channel.assertQueue('book.updates', { durable: true });

    // Bind queues to exchanges
    await channel.bindQueue('book.notifications', 'library.events', 'book.#');
    await channel.bindQueue('book.updates', 'library.direct', 'book.update');

    // Start consuming messages
    await startConsuming();

    logger.info('RabbitMQ initialized successfully');

    // Handle connection close
    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      setTimeout(initRabbitMQ, 5000); // Reconnect after 5 seconds
    });

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err);
    });

  } catch (error) {
    logger.error('Failed to initialize RabbitMQ:', error);
    throw error;
  }
}

async function startConsuming() {
  // Consume book notifications
  await channel.consume('book.notifications', async (msg) => {
    if (msg !== null) {
      try {
        const content = JSON.parse(msg.content.toString());
        logger.info('Received notification:', content);
        
        // Process notification
        await handleNotification(content);
        
        channel.ack(msg);
      } catch (error) {
        logger.error('Error processing notification:', error);
        channel.nack(msg, false, false); // Don't requeue
      }
    }
  }, { noAck: false });

  // Consume book updates
  await channel.consume('book.updates', async (msg) => {
    if (msg !== null) {
      try {
        const content = JSON.parse(msg.content.toString());
        logger.info('Received book update:', content);
        
        // Process update
        await handleBookUpdate(content);
        
        channel.ack(msg);
      } catch (error) {
        logger.error('Error processing book update:', error);
        channel.nack(msg, false, true); // Requeue on error
      }
    }
  }, { noAck: false });
}

async function publishMessage(exchange, routingKey, message) {
  try {
    const content = Buffer.from(JSON.stringify(message));
    
    channel.publish(exchange, routingKey, content, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now()
    });
    
    logger.info(`Message published to ${exchange} with routing key ${routingKey}`);
  } catch (error) {
    logger.error('Failed to publish message:', error);
    throw error;
  }
}

async function handleNotification(content) {
  // Implement notification handling logic
  logger.info('Processing notification:', content);
}

async function handleBookUpdate(content) {
  // Implement book update logic
  logger.info('Processing book update:', content);
}

async function disconnectRabbitMQ() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info('RabbitMQ disconnected');
  } catch (error) {
    logger.error('Error disconnecting RabbitMQ:', error);
  }
}

module.exports = {
  initRabbitMQ,
  publishMessage,
  disconnectRabbitMQ
};
