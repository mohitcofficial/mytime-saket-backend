import mongoose from "mongoose";
import { createSuperAdmin } from "../utils/createSuperAdmin.js";

export const connectDB = async () => {
  mongoose.set("strictQuery", false);
  const { connection } = await mongoose.connect(
    "mongodb://127.0.0.1:27017/mytime?replicaSet=rs0",
  );

  console.log(`MongoDB connected with ${connection.host}`);

  await createSuperAdmin();
};
