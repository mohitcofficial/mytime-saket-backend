import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";
import { getAllActivities } from "../controller/activityController.js";

const router = express.Router();

router
  .route("/activities")
  .get(
    isAuthenticated,
    authorizeRoles("super_admin", "admin"),
    getAllActivities,
  );

export default router;
