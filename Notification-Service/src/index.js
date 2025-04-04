const express = require("express");
const app = express();

const { ServerConfig } = require("./config"); // Import ServerConfig
const { sequelize } = require("./models"); // Import sequelize từ models/index.js
const apiRoutes = require("./routes");
const amqplib = require("amqplib");

const { sendEmail } = require("./utils/mailer");
const { CRONS } = require("./utils/common");

async function connectQueue() {
  try {
    const connection = await amqplib.connect(ServerConfig.RABBITMQ_URL); // Sử dụng URL từ ServerConfig
    console.log("✅ Connected to RabbitMQ");

    const channel = await connection.createChannel();
    await channel.assertQueue("NOTIFICATION_QUEUE");

    channel.consume("NOTIFICATION_QUEUE", async (data) => {
      const { recipientEmail, subject, text, html } = JSON.parse(data.content.toString());

      console.log(`📥 Received message for ${recipientEmail}`);

      // Gửi email
      await sendEmail(
        ServerConfig.GMAIL_ID,
        recipientEmail,
        subject,
        text,
        html
      );
      

      console.log(`📧 Email sent to ${recipientEmail}`);
      channel.ack(data);
    });
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    throw error;
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Successfully connected to the database (MySQL)");

    await connectQueue();
    await CRONS(sendEmail);
    console.log("✅ Cron jobs started");

    app.listen(ServerConfig.PORT, () => {
      console.log(`✅ Successfully started the server on PORT: ${ServerConfig.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
}


startServer();
