import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Company } from "../models/Company.js";
import { Client } from "../models/Client.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { Payment } from "../models/Payment.js";
import { Service } from "../models/Service.js";
import { recalculateBookingAmount } from "../utils/recalculateTotalAmount.js";
import { Invoice } from "../models/Invoice.js";
import {
  convertStringBooleans,
  logActivity,
  removeEmptyFields,
} from "../utils/helper.js";

export const createBooking = catchAsyncError(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const {
      companyData,
      clients = [],
      bookingData,
      serviceData,
      paymentData,
      invoiceData,
    } = req.body;

    const filteredBookingData = removeEmptyFields(bookingData);

    // Check Booking ID uniqueness
    if (filteredBookingData?.bookingID) {
      const bookingID = filteredBookingData.bookingID.trim();

      const existingBooking = await Booking.findOne({
        bookingID,
      }).session(session);

      if (existingBooking) {
        throw new ErrorHandler(`Booking ID '${bookingID}' already exists`, 400);
      }
    }

    // Create Company Snapshot
    const [company] = await Company.create([companyData], { session });

    // Create Client Snapshots
    if (clients.length) {
      await Client.insertMany(
        clients.map((client) => ({
          ...client,
          companyID: company._id,
        })),
        { session },
      );
    }

    // Create Booking
    const [booking] = await Booking.create(
      [
        {
          ...filteredBookingData,
          companyID: company._id,
          companyName: company.name,

          amount: paymentData.amount,
          totalAmount: paymentData.amount,
        },
      ],
      { session },
    );

    // Create Invoice
    const [invoice] = await Invoice.create([invoiceData], { session });

    // Create Payment
    const [payment] = await Payment.create(
      [
        {
          ...paymentData,
          invoiceID: invoice._id,
        },
      ],
      { session },
    );

    // Create Service
    const [service] = await Service.create(
      [
        {
          ...serviceData,
          bookingID: booking._id,
          paymentID: payment._id,
        },
      ],
      { session },
    );

    // Attach Service To Booking
    booking.services = [service._id];

    await booking.save({ session });

    await session.commitTransaction();

    await logActivity({
      user: req.user._id,
      module: "Booking",
      action: "CREATE",
      documentId: booking._id,
      documentName: booking.bookingID,
      message: `Created booking ${booking.bookingID}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: "Booking Created Successfully!",
      booking,
    });
  } catch (error) {
    await session.abortTransaction();

    return next(new ErrorHandler(error.message, 500));
  } finally {
    await session.endSession();
  }
});

export const searchBookings = catchAsyncError(async (req, res, next) => {
  const {
    bookingID,
    companyName,
    clientName,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  // Booking ID
  if (bookingID?.trim()) {
    query.bookingID = {
      $regex: bookingID.trim(),
      $options: "i",
    };
  }

  // Company Name
  if (companyName?.trim()) {
    query.companyName = {
      $regex: companyName.trim(),
      $options: "i",
    };
  }

  // Client Name
  if (clientName?.trim()) {
    const clients = await Client.find({
      name: {
        $regex: clientName.trim(),
        $options: "i",
      },
    }).select("companyID");

    const companyIds = [
      ...new Set(clients.map((client) => client.companyID?.toString())),
    ];

    // No matching clients
    if (!companyIds.length) {
      return res.status(200).json({
        success: true,
        totalRecords: 0,
        totalPages: 0,
        currentPage: Number(page),
        bookings: [],
      });
    }

    query.companyID = {
      $in: companyIds,
    };
  }

  // Date Range Filter
  if (startDate || endDate) {
    query.bookingDate = {};

    if (startDate) {
      query.bookingDate.$gte = new Date(startDate);
    }

    if (endDate) {
      const end = new Date(endDate);

      // Include entire end date
      end.setHours(23, 59, 59, 999);

      query.bookingDate.$lte = end;
    }
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.max(Number(limit) || 20, 1);
  const skip = (currentPage - 1) * perPage;

  const totalRecords = await Booking.countDocuments(query);

  const bookings = await Booking.find(query)
    .populate("companyID")
    .populate("aggregator")
    .populate("services")
    .populate("assignedTo", "name email")
    .sort({ bookingDate: -1 })
    .skip(skip)
    .limit(perPage)
    .lean();

  // Get unique company IDs from bookings
  const companyIds = [
    ...new Set(
      bookings
        .map((booking) => booking.companyID?._id?.toString())
        .filter(Boolean),
    ),
  ];

  // Fetch all clients for those companies
  const clients = await Client.find({
    companyID: { $in: companyIds },
  }).lean();

  // Group clients by companyID
  const clientsByCompany = clients.reduce((acc, client) => {
    const companyId = client.companyID.toString();

    if (!acc[companyId]) {
      acc[companyId] = [];
    }

    acc[companyId].push(client);

    return acc;
  }, {});

  // Attach clients to each booking
  const bookingsWithClients = bookings.map((booking) => ({
    ...booking,
    clients: clientsByCompany[booking.companyID?._id?.toString()] || [],
  }));

  res.status(200).json({
    success: true,
    totalRecords,
    totalPages: Math.ceil(totalRecords / perPage),
    currentPage,
    perPage,
    bookings: bookingsWithClients,
  });
});

export const searchBooking = catchAsyncError(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("companyID")
    .populate("aggregator")
    .populate("assignedTo", "name email")
    .populate({
      path: "services",
      populate: {
        path: "paymentID",
        populate: {
          path: "invoiceID",
        },
      },
    });

  if (!booking) {
    return next(new ErrorHandler("Booking not found", 404));
  }

  const clients = await Client.find({
    companyID: booking.companyID._id,
  });

  res.status(200).json({
    success: true,
    booking,
    company: booking.companyID,
    clients,
    services: booking.services,
  });
});

export const deleteBooking = catchAsyncError(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      throw new ErrorHandler("Booking not found", 404);
    }

    /*
      ==========================
      Fetch Services
      ==========================
      */

    const services = await Service.find({
      bookingID: booking._id,
    }).session(session);

    /*
      ==========================
      Delete Payments
      ==========================
      */

    const paymentIds = services
      .map((service) => service.paymentID)
      .filter(Boolean);

    if (paymentIds.length) {
      const payments = await Payment.find({
        _id: { $in: paymentIds },
      }).session(session);

      // Extract invoice IDs
      const invoiceIds = payments
        .map((payment) => payment.invoiceID)
        .filter(Boolean);

      if (invoiceIds.length) {
        await Invoice.deleteMany(
          {
            _id: { $in: invoiceIds },
          },
          { session },
        );
      }

      await Payment.deleteMany(
        {
          _id: { $in: paymentIds },
        },
        { session },
      );
    }

    /*
      ==========================
      Delete Services
      ==========================
      */

    await Service.deleteMany(
      {
        bookingID: booking._id,
      },
      { session },
    );

    /*
      ==========================
      Delete Clients
      ==========================
      */

    await Client.deleteMany(
      {
        companyId: booking.companyID,
      },
      { session },
    );

    /*
      ==========================
      Delete Company
      ==========================
      */

    await Company.findByIdAndDelete(booking.companyID, { session });

    /*
      ==========================
      Delete Booking
      ==========================
      */

    await Booking.findByIdAndDelete(booking._id, { session });

    await session.commitTransaction();

    await logActivity({
      user: req.user._id,
      module: "Booking",
      action: "DELETE",
      documentId: booking._id,
      documentName: booking.bookingID,
      message: `Deleted booking: ${booking.bookingID}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();

    return next(new ErrorHandler(error.message, error.statusCode || 500));
  } finally {
    await session.endSession();
  }
});

export const updateBooking = catchAsyncError(async (req, res, next) => {
  const bookingData = convertStringBooleans(req.body.bookingData);
  const companyData = convertStringBooleans(req.body.companyData);
  const flag = req.body.flag;

  if (bookingData?.bookingID && flag) {
    const check = await Booking.find({ bookingID: bookingData.bookingID });
    if (check.length > 0)
      return next(new ErrorHandler("Booking ID already assigned !", 400));
  }

  const bookingID = req.params.id;

  const booking = await Booking.findByIdAndUpdate(bookingID, bookingData, {
    new: true,
    runValidators: true,
  });

  if (!booking) {
    return next(new ErrorHandler("Booking not found", 404));
  }

  if (companyData && Object.keys(companyData).length > 0 && booking.companyID) {
    await Company.findByIdAndUpdate(booking.companyID, companyData, {
      runValidators: true,
    });

    // Keep booking.companyName in sync if company name changes
    if (companyData.name) {
      booking.companyName = companyData.name;
      await booking.save();
    }
  }

  await logActivity({
    user: req.user._id,
    module: "Booking",
    action: "UPDATE",
    documentId: booking._id,
    documentName: booking.bookingID,
    changes: [],
    message: `Updated booking: ${booking.bookingID}`,
    req,
  });

  res.status(200).json({
    success: true,
    message: "Booking Updated Successfully!",
    booking,
  });
});
export const updateCompany = catchAsyncError(async (req, res, next) => {
  const companyData = req.body.companyData;

  const bookingID = req.params.bookingID;
  const companyID = req.params.companyID;

  const booking = await Booking.findById(bookingID);

  if (!booking) return next(new ErrorHandler("Booking not found", 404));

  const company = await Company.findByIdAndUpdate(companyID, companyData, {
    runValidators: true,
    returnDocument: "after",
  });

  if (!company) return next(new ErrorHandler("Company not found", 404));

  booking.companyName = companyData.name;
  await booking.save();

  await logActivity({
    user: req.user._id,
    module: "Company",
    action: "UPDATE",
    documentId: company._id,
    documentName: company.name,
    changes: [],
    message: `Updated company details for booking: ${booking.bookingID}`,
    req,
  });

  res.status(200).json({
    success: true,
    message: "Company Updated Successfully!",
  });
});

export const addClient = catchAsyncError(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return next(new ErrorHandler("Booking not found", 404));
  }

  const client = await Client.create({
    ...req.body,
    companyID: booking.companyID,
  });

  await logActivity({
    user: req.user._id,
    module: "Client",
    action: "CREATE",
    documentId: client._id,
    documentName: client.name,
    changes: [],
    message: `Added New Client to booking: ${booking.bookingID}`,
    req,
  });

  res.status(201).json({
    success: true,
    message: "Client Added Successfully !",
    client,
  });
});

export const updateClient = catchAsyncError(async (req, res, next) => {
  const client = await Client.findByIdAndUpdate(req.params.clientId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!client) {
    return next(new ErrorHandler("Client not found", 404));
  }

  const booking = await Booking.findOne({
    companyID: client.companyID,
  }).select("_id bookingID");

  await logActivity({
    user: req.user._id,
    module: "Client",
    action: "UPDATE",
    documentId: client._id,
    documentName: client.name,
    changes: [],
    message: `Updated Client details for booking ${booking?.bookingID}`,
    req,
  });

  res.status(200).json({
    success: true,
    message: "Client Updated Successfully !",
    client,
  });
});

export const deleteClient = catchAsyncError(async (req, res, next) => {
  const client = await Client.findById(req.params.clientId);

  if (!client) {
    return next(new ErrorHandler("Client not found", 404));
  }

  const booking = await Booking.findOne({
    companyID: client.companyID,
  }).select("_id bookingID");

  await client.deleteOne();

  await logActivity({
    user: req.user._id,
    module: "Client",
    action: "DELETE",
    documentId: client._id,
    documentName: client.name,
    changes: [],
    message: `Deleted Client details for booking ${booking?.bookingID}`,
    req,
  });

  res.status(200).json({
    success: true,
    message: "Client deleted successfully",
  });
});

export const addService = catchAsyncError(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return next(new ErrorHandler("Booking not found", 404));
  }

  const invoice = await Invoice.create(req.body.invoiceData);
  const payment = await Payment.create({
    ...req.body.paymentData,
    invoiceID: invoice._id,
  });

  const service = await Service.create({
    ...req.body.serviceData,
    bookingID: booking._id,
    paymentID: payment._id,
  });

  booking.services.push(service._id);

  await booking.save();

  await recalculateBookingAmount(booking._id);

  await logActivity({
    user: req.user._id,
    module: "Service",
    action: "CREATE",
    documentId: service._id,
    documentName: service.name,
    changes: [],
    message: `Added New Service to booking: ${booking.bookingID}`,
    req,
  });

  res.status(201).json({
    success: true,
    message: "Service Added Successfully !",
    service,
  });
});

export const updateService = catchAsyncError(async (req, res, next) => {
  const service = await Service.findById(req.params.serviceId);

  if (!service) return next(new ErrorHandler("Service not found", 404));

  const booking = await Booking.findById(service.bookingID).select(
    "_id bookingID",
  );

  await Service.findByIdAndUpdate(service._id, req.body.serviceData, {
    runValidators: true,
  });

  await Payment.findByIdAndUpdate(service.paymentID, req.body.paymentData, {
    runValidators: true,
  });

  if (req.body.invoiceData?._id) {
    await Invoice.findByIdAndUpdate(
      req.body.invoiceData?._id,
      req.body.invoiceData,
      {
        runValidators: true,
      },
    );
  }

  await recalculateBookingAmount(service.bookingID);

  await logActivity({
    user: req.user._id,
    module: "Service",
    action: "UPDATE",
    documentId: service._id,
    documentName: service.name,
    changes: [],
    message: `Updated Service details for booking ${booking?.bookingID}`,
    req,
  });

  res.status(200).json({
    success: true,
    message: "Service updated successfully",
  });
});

export const deleteService = catchAsyncError(async (req, res, next) => {
  const service = await Service.findById(req.params.serviceId);

  if (!service) {
    return next(new ErrorHandler("Service not found", 404));
  }

  await Payment.findByIdAndDelete(service.paymentID);

  const booking = await Booking.findByIdAndUpdate(service.bookingID, {
    $pull: {
      services: service._id,
    },
  });

  await service.deleteOne();

  await recalculateBookingAmount(service.bookingID);

  await logActivity({
    user: req.user._id,
    module: "Service",
    action: "DELETE",
    documentId: service._id,
    documentName: service.name,
    changes: [],
    message: `Deleted Service details for booking ${booking?.bookingID}`,
    req,
  });

  res.status(200).json({
    success: true,
    message: "Service deleted successfully",
  });
});

export const getRaisedInvoiceBookings = catchAsyncError(
  async (req, res, next) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const isRaised = false;

    const result = await Service.aggregate([
      // Join Payment
      {
        $lookup: {
          from: "payments",
          localField: "paymentID",
          foreignField: "_id",
          as: "payment",
        },
      },
      {
        $unwind: "$payment",
      },

      // Join Invoice
      {
        $lookup: {
          from: "invoices",
          localField: "payment.invoiceID",
          foreignField: "_id",
          as: "invoice",
        },
      },
      {
        $unwind: "$invoice",
      },

      // Filter by invoice status
      {
        $match: {
          "invoice.isRaised": isRaised,
        },
      },

      // Get unique bookings
      {
        $group: {
          _id: "$bookingID",
        },
      },

      // Join Booking
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "_id",
          as: "booking",
        },
      },
      {
        $unwind: "$booking",
      },

      // Make booking the root document
      {
        $replaceRoot: {
          newRoot: "$booking",
        },
      },

      // Populate Aggregator
      {
        $lookup: {
          from: "aggregators",
          localField: "aggregator",
          foreignField: "_id",
          as: "aggregator",
        },
      },
      {
        $unwind: {
          path: "$aggregator",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Sort by booking date
      {
        $sort: {
          bookingDate: -1,
        },
      },

      // Pagination
      {
        $facet: {
          bookings: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const bookings = result[0].bookings;
    const totalBookings = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalBookings / limit);

    res.status(200).json({
      success: true,
      bookings,
      currentPage: page,
      totalPages,
      totalBookings,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  },
);
