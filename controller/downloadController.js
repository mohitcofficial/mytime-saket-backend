import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify";
import { Booking } from "../models/Booking.js";
import { Client } from "../models/Client.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";

export const exportBookingsCSV = catchAsyncError(async (req, res, next) => {
  const { bookingID, companyName, clientName, startDate, endDate } = req.query;

  const query = {};

  // ==========================================
  // BOOKING ID
  // ==========================================

  if (bookingID?.trim()) {
    query.bookingID = {
      $regex: bookingID.trim(),
      $options: "i",
    };
  }

  // ==========================================
  // COMPANY NAME
  // ==========================================

  if (companyName?.trim()) {
    query.companyName = {
      $regex: companyName.trim(),
      $options: "i",
    };
  }

  // ==========================================
  // CLIENT NAME
  // ==========================================

  if (clientName?.trim()) {
    const clients = await Client.find({
      name: {
        $regex: clientName.trim(),
        $options: "i",
      },
    })
      .select("companyID")
      .lean();

    const companyIds = [
      ...new Set(
        clients.map((client) => client.companyID?.toString()).filter(Boolean),
      ),
    ];

    if (!companyIds.length) {
      return res.status(200).json({
        success: true,
        message: "No bookings found",
        totalRecords: 0,
      });
    }

    query.companyID = {
      $in: companyIds,
    };
  }

  // ==========================================
  // DATE RANGE
  // ==========================================

  if (startDate || endDate) {
    query.bookingDate = {};

    if (startDate) {
      const start = new Date(startDate);

      start.setHours(0, 0, 0, 0);

      query.bookingDate.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);

      end.setHours(23, 59, 59, 999);

      query.bookingDate.$lte = end;
    }
  }

  // ==========================================
  // FILE
  // ==========================================

  const exportDir = path.join(process.cwd(), "exports");

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, {
      recursive: true,
    });
  }

  const fileName = `bookings-${Date.now()}.csv`;

  const filePath = path.join(exportDir, fileName);

  // ==========================================
  // CSV STREAM
  // ==========================================

  const csvStream = stringify({
    header: true,

    columns: [
      "Booking ID",
      "Company Name",
      "Client Name",
      "Client Email",
      "Client Phone",
      "Amount",
      "Total Amount",
      "Tenure",
      "Renewal",
      "Renewed",
      "Status",
      "Booking Date",
      "Final Document Sharing Date",
      "Effective Date",
      "Expiration Date",
      "Agreement Availability",
      "Floor",
      "Aggregator",
      "Services",
      "Assigned To",
      "Assigned To Email",
      "Remark",
    ],
  });

  const fileStream = fs.createWriteStream(filePath);

  csvStream.pipe(fileStream);

  // ==========================================
  // MONGODB CURSOR
  // ==========================================

  const cursor = Booking.find(query)
    .populate({
      path: "companyID",
    })
    .populate({
      path: "aggregator",
    })
    .populate({
      path: "services",
    })
    .populate({
      path: "assignedTo",
      select: "name email",
    })
    .sort({
      bookingDate: -1,
    })
    .lean()
    .cursor({
      batchSize: 500,
    });

  // ==========================================
  // PROCESS BOOKINGS
  // ==========================================

  for await (const booking of cursor) {
    // ----------------------------------------
    // Get clients for this company
    // ----------------------------------------

    const clients = await Client.find({
      companyID: booking.companyID?._id,
    })
      .select("name email phone")
      .lean();

    // ----------------------------------------
    // Client names
    // ----------------------------------------

    const clientNames = clients
      .map((client) => client.name)
      .filter(Boolean)
      .join(", ");

    const clientEmails = clients
      .map((client) => client.email)
      .filter(Boolean)
      .join(", ");

    const clientPhones = clients
      .map((client) => client.phone)
      .filter(Boolean)
      .join(", ");

    // ----------------------------------------
    // Services
    // ----------------------------------------

    const services =
      booking.services
        ?.map((service) => {
          return service.name || service.serviceName || "";
        })
        .filter(Boolean)
        .join(", ") || "";

    // ----------------------------------------
    // CSV ROW
    // ----------------------------------------

    csvStream.write([
      booking.bookingID || "",

      booking.companyName || "",

      clientNames,

      clientEmails,

      clientPhones,

      booking.amount ?? "",

      booking.totalAmount ?? "",

      booking.tenure || "",

      booking.isRenewal ? "Yes" : "No",

      booking.renewed ? "Yes" : "No",

      booking.status || "",

      formatDate(booking.bookingDate),

      formatDate(booking.finalDocumentSharingDate),

      formatDate(booking.effectiveDate),

      formatDate(booking.expirationDate),

      booking.agreementAvailability ? "Yes" : "No",

      booking.floor || "",

      booking.aggregator?.name || "",

      services,

      booking.assignedTo?.name || "",

      booking.assignedTo?.email || "",

      booking.remark || "",
    ]);
  }

  // ==========================================
  // FINISH CSV
  // ==========================================

  csvStream.end();

  await new Promise((resolve, reject) => {
    fileStream.on("finish", resolve);
    fileStream.on("error", reject);
  });

  // ==========================================
  // DOWNLOAD
  // ==========================================

  res.download(filePath, "bookings.csv", (error) => {
    // Delete temporary file
    fs.unlink(filePath, () => {});

    if (error && !res.headersSent) {
      next(error);
    }
  });
});

// ==========================================
// DATE FORMATTER
// ==========================================

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
