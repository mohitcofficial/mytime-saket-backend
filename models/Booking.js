import mongoose from "mongoose";
import validator from "validator";

const bookingSchema = mongoose.Schema(
  {
    bookingID: {
      type: String,
    },
    companyName: {
      type: String,
    },
    companyID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    amount: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    tenure: {
      type: String,
    },
    isRenewal: {
      type: Boolean,
      default: false,
    },
    renewed: {
      type: Boolean,
      default: false,
    },
    aggregator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Aggregator",
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    status: {
      type: String,
      enum: [
        "documents_pending",
        "draft_approval_pending",
        "sent_for_notary",
        "countersign_pending",
        "final_document_shared",
        "cancelled",
        "hold",
        "expired",
      ],
      default: "draft_approval_pending",
    },
    bookingDate: {
      type: Date,
    },
    finalDocumentSharingDate: {
      type: Date,
    },
    effectiveDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
    },
    agreementAvailability: {
      type: Boolean,
      default: false,
    },
    floor: {
      type: String,
      enum: ["second", "third"],
      default: "second",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remark: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ bookingID: 1 });
bookingSchema.index({ companyName: 1 });
bookingSchema.index({ bookingDate: -1 });

bookingSchema.pre("save", function () {
  if (!this.bookingID) {
    this.bookingID = this._id.toString();
  }
});

export const Booking = mongoose.model("Booking", bookingSchema);
