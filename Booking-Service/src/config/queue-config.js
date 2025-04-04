const amqplib = require("amqplib");

let channel, connection;

async function connectQueue() {
  try {
    connection = await amqplib.connect("amqp://rabbitmq:5672"); // Địa chỉ RabbitMQ từ docker-compose.yml
    channel = await connection.createChannel();
    await channel.assertQueue("booking-queue");
    console.log("Connected to RabbitMQ");
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    throw error;
  }
}

module.exports = {
  connectQueue,
  channel,
};