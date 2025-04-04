const { BookingController } = require("../../controllers");

const express = require("express");
const router = express.Router();

router.get("/", BookingController.getBookings); // Thêm route này
router.post("/", BookingController.createBooking);
router.post("/payment", BookingController.makePayment);
router.post("/cancel/:bookingId", BookingController.cancelBooking);
router.get("/:userId", BookingController.getAllBookings);

module.exports = router;