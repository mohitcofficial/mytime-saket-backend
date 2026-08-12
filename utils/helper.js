import Activity from "../models/Activity.js";

export const removeEmptyFields = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== ""),
  );
};

export const convertStringBooleans = (obj) => {
  const result = {};

  for (const key in obj) {
    const value = obj[key];

    if (value === "true") {
      result[key] = true;
    } else if (value === "false") {
      result[key] = false;
    } else {
      result[key] = value;
    }
  }

  return result;
};

export const logActivity = async ({
  user,
  module,
  action,
  documentId,
  documentName = "",
  changes = [],
  message,
  req,
}) => {
  try {
    await Activity.create({
      performedBy: user,
      module,
      action,
      documentId,
      documentName,
      changes,
      message,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      endpoint: req.originalUrl,
      method: req.method,
    });
  } catch (err) {
    console.error("Activity Log Error:", err.message);
  }
};

export const getChanges = (oldData, newData) => {
  const changes = [];

  Object.keys(newData).forEach((key) => {
    const oldValue = oldData[key];
    const newValue = newData[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      });
    }
  });

  return changes;
};
