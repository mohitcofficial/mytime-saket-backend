import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    // Who performed the action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Module on which action happened
    module: {
      type: String,
      required: true,
      enum: [
        "User",
        "Aggregator",
        "Booking",
        "Company",
        "Service",
        "Client",
        "Invoice",
        "Payment",
      ],
    },

    // CRUD Action
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "VIEW", "LOGIN", "LOGOUT"],
    },

    // Record affected
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Display name of the record
    documentName: {
      type: String,
      default: "",
    },

    // Changes made
    changes: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      },
    ],

    // Short readable message
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ performedBy: 1 });
activitySchema.index({ module: 1 });
activitySchema.index({ documentId: 1 });

export default mongoose.model("Activity", activitySchema);
