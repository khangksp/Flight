const { BookingRepository } = require("../repositories");
const { StatusCodes } = require("http-status-codes");
const axios = require("axios");
const { ServerConfig } = require("../config");
const { AppError } = require("../utils");
const { FLIGHT_SERVICE } = ServerConfig;

const { Queue } = require("../config");

const db = require("../models");

const { Enums, EmailTemplate } = require("../utils/common");
const { BOOKED, CANCELLED, INITIATED } = Enums.BOOKING_STATUS;

const bookingRepository = new BookingRepository();

const { Sequelize, QueryTypes } = require("sequelize");

async function createBooking(data) {
  const transaction = await db.sequelize.transaction();
  transaction.ISOLATION_LEVELS.SERIALIZABLE;
  try {
    console.log("Requesting flight service...");
    const flight = await axios.get(
      `${FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
    );

    const flightData = flight.data.data;
    if (data.noOfSeats > flightData.totalSeats) {
      throw new AppError("Not enough seats available", StatusCodes.BAD_REQUEST);
    }

    const totalBillingAmount = data.noOfSeats * flightData.price;
    console.log(totalBillingAmount);

    const bookingPayload = {
      flightId: data.flightId,
      noOfSeats: data.noOfSeats,
      userId: data.userId, // Sử dụng userId từ data
      totalCost: totalBillingAmount,
    };

    const booking = await bookingRepository.create(bookingPayload, transaction);

    const response = await axios.patch(
      `${FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,
      {
        seats: data.noOfSeats,
      }
    );

    await transaction.commit();
    return booking;
  } catch (error) {
    console.log("We are here inside catch block");
    console.log("first error", error.StatusCodes);
    await transaction.rollback();
    throw error;
  }
}

async function makePayment(data) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(
      data.bookingId,
      transaction
    );

    if (bookingDetails.status === CANCELLED) {
      throw new AppError("Booking has expired", StatusCodes.BAD_REQUEST);
    }

    if (bookingDetails.userId != data.userId) {
      throw new AppError("User Id does not match", StatusCodes.BAD_REQUEST);
    }

    const bookingTime = new Date(bookingDetails.createdAt);
    const currentTime = new Date();

    if (currentTime - bookingTime > 300000) {
      await cancelBooking(data);
      throw new AppError("Booking has expired", StatusCodes.BAD_REQUEST);
    }

    if (bookingDetails.totalCost != data.totalCost) {
      throw new AppError(
        "Payment amount does not match with totalCost",
        StatusCodes.BAD_REQUEST
      );
    }

    console.log("bookingId is inside booking-service ", data.bookingId);
    const response = await bookingRepository.update(
      data.bookingId,
      { status: BOOKED },
      transaction
    );
    console.log("response inside booking/payment service", response);

    const flight = await axios.get(
      `${FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}`
    );
    const flightData = flight.data.data;

    // Lấy email người dùng từ database
    const user = await db.sequelize.query(
      `SELECT email FROM Users WHERE id = ${bookingDetails.userId}`,
      {
        type: QueryTypes.SELECT,
      }
    );
    const userEmail = user[0]?.email || "unknown@example.com"; // Fallback email nếu không tìm thấy

    Queue.sendData({
      recipientEmail: userEmail,
      html: EmailTemplate.BookingMailTemplate(
        bookingDetails.flightId,
        bookingDetails.noOfSeats,
        flightData,
        userEmail
      ),
      text: "Your flight is booked. it's a plain text since html is not working",
      subject: `Confirmation : Your flight has been booked for Booking-Id : ${data.bookingId} - FlyRight Airlines`,
      status: "BOOKED",
      arrival: flightData.arrivalTime,
      departure: flightData.departureTime,
      bookingId: bookingDetails.id,
      seats: bookingDetails.noOfSeats,
    });
    await transaction.commit();

    return response;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelBooking(data) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(
      data.bookingId,
      transaction
    );
    if (bookingDetails.status === CANCELLED) {
      await transaction.commit();
      return true;
    }

    if (bookingDetails.userId != data.userId) {
      throw new AppError("User Id does not match", StatusCodes.BAD_REQUEST);
    }

    await axios.patch(
      `${FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`,
      {
        seats: bookingDetails.noOfSeats,
        dec: 0,
      }
    );

    await bookingRepository.update(
      data.bookingId,
      { status: CANCELLED },
      transaction
    );

    const flight = await axios.get(
      `${FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}`
    );
    const flightData = flight.data.data;

    // Lấy email người dùng từ database
    const user = await db.sequelize.query(
      `SELECT email FROM Users WHERE id = ${bookingDetails.userId}`,
      {
        type: QueryTypes.SELECT,
      }
    );
    const userEmail = user[0]?.email || "unknown@example.com";

    Queue.sendData({
      recipientEmail: userEmail,
      html: EmailTemplate.CancelBookingMailTemplate(
        bookingDetails.flightId,
        bookingDetails.noOfSeats,
        flightData,
        userEmail
      ),
      text: "it's a plain text since html is not working",
      subject: `Cancellation : Your flight has been cancelled for Booking-Id : ${data.bookingId} - FlyRight Airlines`,
      status: "CANCELLED",
      arrival: flightData.arrivalTime,
      departure: flightData.departureTime,
      bookingId: bookingDetails.id,
      seats: bookingDetails.noOfSeats,
    });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelOldBookings() {
  try {
    const currentDate = new Date(Date.now() - 1000 * 300);
    const response = await bookingRepository.cancelOldBookings(currentDate);
    return response;
  } catch (error) {
    console.log("Error in Booking-service cancelOldBookings", error);
  }
}

async function getAllBookings(userId) {
  try {
    const response = await bookingRepository.getAllBookings(userId);
    return response;
  } catch (error) {
    console.log("Error in Booking-service getAllBookings", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw error;
  }
}
async function getAllBookings() {
  try {
    const bookings = await bookingRepository.getAll();
    return bookings;
  } catch (error) {
    console.log("Error in Booking-service getAllBookings", error);
    throw error;
  }
}
module.exports = {
  createBooking,
  makePayment,
  cancelOldBookings,
  getAllBookings,
  cancelBooking,
};