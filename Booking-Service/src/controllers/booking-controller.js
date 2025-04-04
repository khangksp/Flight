const { StatusCodes } = require("http-status-codes");
const amqp = require("amqplib");

const { BookingService } = require("../services");
const { SuccessResponse, ErrorResponse } = require("../utils/common");

const inMemDb = {};
const RABBITMQ_URL = "amqp://rabbitmq:5672"; // URL RabbitMQ

async function sendToQueue(queue, message) {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`📥 Sent message to queue ${queue}:`, message);

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("🐰 RabbitMQ Error:", error);
  }
}

async function createBooking(req, res) {
  try {
    const booking = await BookingService.createBooking({
      flightId: req.body.flightId,
      userId: req.body.userId,
      noOfSeats: req.body.noOfSeats,
    });

    SuccessResponse.data = booking;
    res.status(StatusCodes.CREATED).json(SuccessResponse);

    // Gửi message tới RabbitMQ sau khi booking được tạo thành công
    const message = {
      action: "BOOKING_CREATED",
      bookingId: booking.id,
      userId: req.body.userId,
      recipientEmail: req.body.recipientEmail, // Thêm email người nhận
      flightId: req.body.flightId,
      noOfSeats: req.body.noOfSeats,
      status: booking.status
    };
    await sendToQueue("NOTIFICATION_QUEUE", message); // Đúng tên queue

  } catch (error) {
    ErrorResponse.error = error;
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json(ErrorResponse);
  }
}

async function cancelBooking(req, res) {
  try {
    const data = { bookingId: req.params.bookingId, userId: req.body.userId };
    const booking = await BookingService.cancelBooking(data);

    SuccessResponse.data = booking;
    res.status(StatusCodes.OK).json(SuccessResponse);

    // Gửi message tới RabbitMQ khi một booking bị hủy
    const message = {
      action: "BOOKING_CANCELLED",
      bookingId: booking.id,
      userId: req.body.userId,
      recipientEmail: req.body.recipientEmail,
      status: booking.status
    };
    await sendToQueue("NOTIFICATION_QUEUE", message); // Đúng tên queue

  } catch (error) {
    ErrorResponse.error = error;
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json(ErrorResponse);
  }
}

// Placeholder cho các hàm khác (Cần định nghĩa hoặc import từ các file khác)
async function getBookings(req, res) {}
async function makePayment(req, res) {}
async function getAllBookings(req, res) {}

module.exports = {
  getBookings,
  createBooking,
  makePayment,
  getAllBookings,
  cancelBooking,
};
