import { Booking } from "../models/Booking.js";
import { Service } from "../models/Service.js";

export const recalculateBookingAmount = async (bookingId, session = null) => {
  const services = await Service.find({
    bookingID: bookingId,
  })
    .populate("paymentID")
    .session(session);

  const totalAmount = services.reduce(
    (sum, service) => sum + (service.paymentID?.amount || 0),
    0,
  );

  await Booking.findByIdAndUpdate(
    bookingId,
    {
      totalAmount,
    },
    { session },
  );
};
