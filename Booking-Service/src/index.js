const express = require("express");
const amqplib = require("amqplib");

const { ServerConfig, Queue } = require("./config"); // Chỉ import ServerConfig và Queue
const { sequelize } = require("./models"); // Import sequelize từ models/index.js
const apiRoutes = require("./routes");

const app = express();
const { BookingService } = require("./services");
const CRONS = require("./utils/common/cron-jobs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Successfully connected to the database (MySQL)");
    CRONS(BookingService);
    console.log("Cron jobs started");
    await Queue.connectQueue();
    console.log("Successfully connected to RabbitMQ");
    app.listen(ServerConfig.PORT, () => {
      console.log(`Successfully started the server on PORT: ${ServerConfig.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

startServer();