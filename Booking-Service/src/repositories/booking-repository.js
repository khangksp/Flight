const { Booking } = require("../models");

class BookingRepository {
  async create(data, transaction) {
    return await Booking.create(data, { transaction });
  }

  async get(id, transaction) {
    return await Booking.findByPk(id, { transaction });
  }

  async update(id, data, transaction) {
    const booking = await Booking.findByPk(id, { transaction });
    if (!booking) {
      throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
    }
    return await booking.update(data, { transaction });
  }

  async getAll() {
    return await Booking.findAll();
  }

  async getAllBookings(userId) {
    return await Booking.findAll({ where: { userId } });
  }

  async cancelOldBookings(date) {
    return await Booking.update(
      { status: CANCELLED },
      { where: { createdAt: { [Sequelize.Op.lt]: date }, status: INITIATED } }
    );
  }
}

module.exports = BookingRepository;