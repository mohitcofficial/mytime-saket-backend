import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler.js";
import { catchAsyncError } from "./catchAsyncError.js";
import { User } from "../models/User.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { authToken } = req.cookies;

  if (!authToken) return next(new ErrorHandler("Not logged in!", 401));

  const decoded = jwt.verify(authToken, process.env.JWT_SECRET);

  let user = await User.findById(decoded._id);

  if (!user) return next(new ErrorHandler("Not Logged In !", 401));
  if (!user.isActive)
    return next(
      new ErrorHandler(
        "Your account has been deactivated. Contact administrator.",
        403,
      ),
    );

  req.user = user;

  next();
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler("Access denied", 403));
    }
    next();
  };
};
