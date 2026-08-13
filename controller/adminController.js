import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import bcrypt from "bcrypt";
import { sendJWTToken } from "../utils/sendJWTToken.js";
import mongoose from "mongoose";

export const createAdmin = catchAsyncError(async (req, res, next) => {
  const { name, email, phone, password, user } = req.body;

  if (!name) return next(new ErrorHandler("Please provide name", 400));
  if (!email) return next(new ErrorHandler("Please provide email", 400));
  if (!phone) return next(new ErrorHandler("Please provide phone", 400));
  if (!password) return next(new ErrorHandler("Please provide password", 400));

  const existingUser = await User.findOne({ email });

  if (existingUser)
    return next(new ErrorHandler("User already exists with this email", 400));

  const role = "admin";
  const newUser = await User.create({
    name,
    email,
    password,
    role,
    phone,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: `Admin created successfully`,
    newUser,
  });
});

export const createUser = catchAsyncError(async (req, res, next) => {
  const { name, email, phone, password, role, isActive } = req.body;

  if (!name) return next(new ErrorHandler("Please provide name", 400));
  if (!email) return next(new ErrorHandler("Please provide email", 400));
  if (!phone) return next(new ErrorHandler("Please provide phone", 400));
  if (!password) return next(new ErrorHandler("Please provide password", 400));
  if (!role) return next(new ErrorHandler("Please provide role", 400));

  const allowedRoles = ["accounts", "operation"];

  if (!allowedRoles.includes(role)) {
    return next(new ErrorHandler("Invalid role", 400));
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new ErrorHandler("User already exists with this email", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    isActive,
    createdBy: req.user._id,
  });

  if (req.file) {
    profileImage = await uploadToCloudinary(req.file);
    user.profileImage = profileImage;
  }

  res.status(201).json({
    success: true,
    message: `${role} role created successfully`,
    user,
  });
});

export const updateUserProfile = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone, password, role, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new ErrorHandler("Invalid User ID", 400));

  const userToUpdate = await User.findById(id).select("+password");

  if (!userToUpdate) return next(new ErrorHandler("User not found", 404));

  const isSelf = req.user._id.toString() === id;
  const isAdmin = req.user.role === "admin";
  const isSuperAdmin = req.user.role === "super_admin";

  if (!isSelf && !isAdmin && !isSuperAdmin)
    return next(new ErrorHandler("Access denied", 403));

  if (isAdmin && userToUpdate.role === "super_admin")
    return next(new ErrorHandler("Access denied", 403));

  if (isAdmin && userToUpdate.role === "admin")
    return next(new ErrorHandler("Admins Cannot Update Another Admins", 403));

  if (isSelf && !isActive)
    return next(new ErrorHandler("You Cannot Deactivate Your Account", 403));
  if (userToUpdate.role === "admin" && !isSuperAdmin)
    return next(
      new ErrorHandler("Only super admin can change admin details", 403),
    );

  userToUpdate.isActive = isActive;
  if (name) userToUpdate.name = name;
  if (email) userToUpdate.email = email;
  if (phone) userToUpdate.phone = phone;
  if (role) userToUpdate.role = role;

  if (req.file) {
    const profileImage = await uploadToCloudinary(req.file);
    const oldPublicId = userToUpdate.profileImage[0]?.public_id;
    if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    userToUpdate.profileImage = profileImage;
  }

  if (password) {
    if (isSelf && !isAdmin && !isSuperAdmin)
      return next(
        new ErrorHandler("You are not allowed to change your password", 403),
      );

    userToUpdate.password = password;
  }

  await userToUpdate.save();

  res.status(200).json({
    success: true,
    message: req.file
      ? "Profile updated successfully & Image Updated"
      : "Profile updated successfully",
    user: userToUpdate,
  });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorHandler("Please provide ID", 400));

  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (user._id.toString() === req.user._id.toString()) {
    return next(new ErrorHandler("You cannot delete your own account", 400));
  }

  if (user.role === "admin" && req.user.role !== "super_admin") {
    return next(new ErrorHandler("You cannot delete another admin", 403));
  }
  if (user.role === "super_admin" && req.user.role === "admin") {
    return next(new ErrorHandler("Admin cannot delete super admin", 403));
  }

  await User.findByIdAndDelete(id);

  res.status(201).json({
    success: true,
    message: "User Deleted Successfully !",
    user,
  });
});

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const { role } = req.query;

  const allowedRoles = ["admin", "accounts", "operations"];

  let query = {};

  if (role) {
    if (!allowedRoles.includes(role))
      return next(new ErrorHandler("Invalid role", 400));

    query.role = role;
  }

  const users = await User.find(query)
    .select("-password")
    .populate("createdBy");

  res.status(200).json({
    success: true,
    count: users.length,
    message: "Users Fetched Successfully!",
    users,
  });
});

export const getAllAdmins = catchAsyncError(async (req, res, next) => {
  const admins = await User.find({ role: "admin" });

  res.status(201).json({
    success: true,
    count: admins.length,
    message: "Admin Fetched Successfully !",
    admins,
  });
});

export const adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) return next(new ErrorHandler("Please provide email", 400));
  if (!password) return next(new ErrorHandler("Please provide password", 400));

  const admin = await User.findOne({ email }).select("+password");

  if (!admin) return next(new ErrorHandler("Invalid email or password", 401));
  if (admin.role !== "admin" && admin.role !== "super_admin")
    return next(new ErrorHandler("Invalid email or password", 401));

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) return next(new ErrorHandler("Invalid email or password", 401));

  if (!admin.isActive)
    return next(
      new ErrorHandler("Your account is deactive. Contact Super Admin", 401),
    );

  sendJWTToken(res, admin, `Welcome Back ${admin.name}`, 200);
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  if (!user) return next(new ErrorHandler("Not Logged In !", 401));

  res.status(200).json({
    success: true,
    user,
  });
});

export const getUserInfo = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorHandler("Please provide ID !", 401));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Not Logged In !", 401));

  res.status(200).json({
    success: true,
    user,
  });
});

export const deactivateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!id) return next(new ErrorHandler("User ID is required", 400));

  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  if (user._id.toString() === req.user._id.toString()) {
    return next(
      new ErrorHandler("You cannot deactivate your own account", 400),
    );
  }

  if (user.role === "admin" && req.user.role !== "super_admin") {
    return next(new ErrorHandler("You cannot deactivate another admin", 403));
  }

  user.isActive = false;

  await user.save();

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
  });
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("authToken", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".mytimeco.work",
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});
