import mongoose from "mongoose";
import validator from "validator";

const serviceSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "business_registration",
        "gst_registration",
        "company_incorporation",
        "mailing_address",
        "permanent_signage",
        "ca_service",
        "redocumentation",
        "authorized_representative",
        "others",
      ],
    },
    bookingID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    paymentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    remark: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

export const Service = mongoose.model("Service", serviceSchema);
