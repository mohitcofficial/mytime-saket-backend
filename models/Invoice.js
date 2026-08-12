import mongoose from "mongoose";
import validator from "validator";

const invoiceSchema = mongoose.Schema(
  {
    isRaised: {
      type: Boolean,
      default: false,
    },
    invoiceNumber: {
      type: String,
    },
    invoiceDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
