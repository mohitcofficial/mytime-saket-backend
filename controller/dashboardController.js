import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Booking } from "../models/Booking.js";

export const dashboardData = catchAsyncError(async (req, res, next) => {
  const { startDate, endDate } = req.body;

  const filter = {};

  if (startDate && endDate) {
    filter.bookingDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // ===========================
  // Card Data
  // ===========================

  const cardResult = await Booking.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,
        newbookingCount: {
          $sum: {
            $cond: [{ $eq: ["$isRenewal", false] }, 1, 0],
          },
        },
        renewalCount: {
          $sum: {
            $cond: [{ $eq: ["$isRenewal", true] }, 1, 0],
          },
        },
        newBookingProfit: {
          $sum: {
            $cond: [{ $eq: ["$isRenewal", false] }, "$totalAmount", 0],
          },
        },
        renewalProfit: {
          $sum: {
            $cond: [{ $eq: ["$isRenewal", true] }, "$totalAmount", 0],
          },
        },
        totalBookings: {
          $sum: 1,
        },
        totalProfit: {
          $sum: "$totalAmount",
        },
      },
    },
  ]);

  const cardData = cardResult[0] || {
    newbookingCount: 0,
    renewalCount: 0,
    newBookingProfit: 0,
    renewalProfit: 0,
    totalBookings: 0,
    totalProfit: 0,
  };

  // ===========================
  // Aggregator Table
  // ===========================

  const aggregatorData = await Booking.aggregate([
    {
      $match: filter,
    },

    {
      $lookup: {
        from: "aggregators",
        localField: "aggregator",
        foreignField: "_id",
        as: "aggregator",
      },
    },

    {
      $unwind: "$aggregator",
    },

    {
      $group: {
        _id: "$aggregator._id",

        aggregatorName: {
          $first: "$aggregator.name",
        },

        newBookings: {
          $sum: {
            $cond: [{ $eq: ["$isRenewal", false] }, 1, 0],
          },
        },

        renewalBookings: {
          $sum: {
            $cond: [{ $eq: ["$isRenewal", true] }, 1, 0],
          },
        },

        newBookingProfit: {
          $sum: {
            $cond: [{ $eq: ["$isRenewal", false] }, "$totalAmount", 0],
          },
        },

        renewalProfit: {
          $sum: {
            $cond: [{ $eq: ["$isRenewal", true] }, "$totalAmount", 0],
          },
        },

        totalBookings: {
          $sum: 1,
        },

        totalProfit: {
          $sum: "$totalAmount",
        },
      },
    },

    {
      $sort: {
        totalBookings: -1,
      },
    },
  ]);

  return res.status(200).json({
    success: true,

    cardData,

    aggregatorData,
  });
});
