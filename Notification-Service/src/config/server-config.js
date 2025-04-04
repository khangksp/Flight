const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false,
});

module.exports = {
  PORT: process.env.PORT || 5000,
  FLIGHT_SERVICE: process.env.FLIGHT_SERVICE,
  BOOKING_SERVICE: process.env.BOOKING_SERVICE,
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://rabbitmq:5672",
  GMAIL_ID: process.env.GMAIL_ID,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  sequelize, // ✅ Đảm bảo xuất instance sequelize ở đây
};
