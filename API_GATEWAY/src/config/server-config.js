const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST, // Bắt buộc phải có DB_HOST
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER, // Bắt buộc phải có DB_USER
  password: process.env.DB_PASSWORD, // Có thể để trống nếu không có mật khẩu
  database: process.env.DB_NAME, // Bắt buộc phải có DB_NAME
  logging: false,
});

module.exports = {
  PORT: process.env.PORT || 5000,
  FLIGHT_SERVICE: process.env.FLIGHT_SERVICE, // Bắt buộc phải có
  BOOKING_SERVICE: process.env.BOOKING_SERVICE, // Bắt buộc phải có
  sequelize,
};