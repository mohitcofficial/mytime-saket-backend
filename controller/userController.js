import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import bcrypt from "bcrypt";
import { sendJWTToken } from "../utils/sendJWTToken.js";
import mongoose from "mongoose";

export const userLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) return next(new ErrorHandler("Please provide email", 400));
  if (!password) return next(new ErrorHandler("Please provide password", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler("Invalid email or password", 401));

  if (user.role === "admin" || user.role === "super_admin")
    return next(new ErrorHandler("Invalid email or password", 401));

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return next(new ErrorHandler("Invalid email or password", 401));

  if (!user.isActive)
    return next(
      new ErrorHandler("Your account is deactive. Contact Admin", 401),
    );

  sendJWTToken(res, user, `Welcome Back ${user.name}`, 200);
});
