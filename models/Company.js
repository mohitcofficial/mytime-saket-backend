import mongoose from "mongoose";
import validator from "validator";

const companySchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    type: {
      type: String,
      enum: [
        "proprietorship",
        "partnership",
        "private_limited",
        "llp",
        "opc",
        "section8",
        "others",
      ],
    },
    panNumber: {
      type: String,
    },
    nature: {
      type: String,
    },
    gstin: {
      type: String,
    },
    cin: {
      type: String,
    },
    remark: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Company = mongoose.model("Company", companySchema);
