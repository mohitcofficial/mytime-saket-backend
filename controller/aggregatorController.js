import { Aggregator } from "../models/Aggregator.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// Create Aggregator
export const createAggregator = catchAsyncError(async (req, res, next) => {
  const { name, services, remark } = req.body;

  if (!name?.trim()) {
    return next(new ErrorHandler("Aggregator name is required", 400));
  }

  const formattedServices = Object.entries(services || {}).map(
    ([serviceName, price]) => ({
      name: serviceName.trim(),
      price: Number(price),
    }),
  );

  const aggregator = await Aggregator.create({
    name: name.trim(),
    services: formattedServices,
    remark,
  });

  res.status(201).json({
    success: true,
    message: "Aggregator created successfully",
    aggregator,
  });
});

// Get All Aggregators
export const getAggregators = catchAsyncError(async (req, res, next) => {
  const aggregators = await Aggregator.find();

  res.status(200).json({
    success: true,
    count: aggregators.length,
    aggregators,
  });
});

// Get Single Aggregator
export const getAggregator = catchAsyncError(async (req, res, next) => {
  const aggregator = await Aggregator.findById(req.params.id);

  if (!aggregator) {
    return next(new ErrorHandler("Aggregator not found", 404));
  }

  res.status(200).json({
    success: true,
    aggregator,
  });
});

// Update Aggregator
export const updateAggregator = catchAsyncError(async (req, res, next) => {
  const { name, services, remark } = req.body;
  const formattedServices = Object.entries(services || {}).map(
    ([serviceName, price]) => ({
      name: serviceName.trim(),
      price: Number(price),
    }),
  );
  const aggregator = await Aggregator.findByIdAndUpdate(
    req.params.id,
    {
      name,
      services: formattedServices,
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!aggregator) {
    return next(new ErrorHandler("Aggregator not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Aggregator updated successfully",
    aggregator,
  });
});

// Delete Aggregator
export const deleteAggregator = catchAsyncError(async (req, res, next) => {
  const aggregator = await Aggregator.findById(req.params.id);

  if (!aggregator) {
    return next(new ErrorHandler("Aggregator not found", 404));
  }

  await aggregator.deleteOne();

  res.status(200).json({
    success: true,
    message: "Aggregator deleted successfully",
  });
});
