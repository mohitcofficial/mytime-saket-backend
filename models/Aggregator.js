import mongoose from "mongoose";
import validator from "validator";

const aggregatorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    services: [
      {
        name: {
          type: String,
          trim: true,
        },
        price: {
          type: Number,
          min: 0,
        },
      },
    ],
    remark: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

export const Aggregator = mongoose.model("Aggregator", aggregatorSchema);
