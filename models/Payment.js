import mongoose from "mongoose";
import validator from "validator";

const paymentSchema = mongoose.Schema(
  {
    invoiceID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    type: {
      type: String,
      enum: [
        "upi",
        "cash",
        "neft",
        "rtgs",
        "net_banking",
        "razorpay",
        "cheque",
        "others",
      ],
      trim: true,
      lowercase: true,
    },
    withGST: {
      type: Boolean,
      default: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
      lowercase: true,
      trim: true,
    },
    pendingAmount: {
      type: Number,
      min: 0,
    },
    remark: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

export const Payment = mongoose.model("Payment", paymentSchema);
