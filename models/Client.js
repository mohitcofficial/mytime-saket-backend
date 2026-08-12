import mongoose from "mongoose";
import validator from "validator";

const clientSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    companyID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    isSigningAuthority: {
      type: String,
    },
    panNumber: {
      type: String,
    },
    aadhaarNumber: {
      type: String,
    },
    remark: {
      type: String,
    },
  },
  { timestamps: true },
);

clientSchema.index({ name: 1 });
clientSchema.index({ companyId: 1 });

export const Client = mongoose.model("Client", clientSchema);
