import { catchAsyncError } from "../middleware/catchAsyncError.js";
import Activity from "../models/Activity.js";

export const getAllActivities = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.max(Number(limit) || 20, 1);
  const skip = (currentPage - 1) * perPage;

  const totalRecords = await Activity.countDocuments();
  const activities = await Activity.find()
    .sort({ createdAt: -1 })
    .populate("performedBy")
    .skip(skip)
    .limit(perPage);

  res.status(200).json({
    success: true,
    totalRecords,
    totalPages: Math.ceil(totalRecords / perPage),
    currentPage,
    perPage,
    activities,
  });
});
