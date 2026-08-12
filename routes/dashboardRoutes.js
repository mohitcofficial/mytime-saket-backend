import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";
import { dashboardData } from "../controller/dashboardController.js";

const router = express.Router();

router
  .route("/dashboard")
  .post(isAuthenticated, authorizeRoles("super_admin", "admin"), dashboardData);

export default router;
