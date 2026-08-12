import express from "express";
import {
  createAggregator,
  getAggregators,
  getAggregator,
  updateAggregator,
  deleteAggregator,
} from "../controller/aggregatorController.js";

import { isAuthenticated, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/aggregator")
  .post(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation"),
    createAggregator,
  )
  .get(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation", "accounts"),
    getAggregators,
  );

router
  .route("/aggregator/:id")
  .get(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation", "accounts"),
    getAggregator,
  )
  .put(
    isAuthenticated,
    authorizeRoles("super_admin", "admin"),
    updateAggregator,
  )
  .delete(
    isAuthenticated,
    authorizeRoles("super_admin", "admin"),
    deleteAggregator,
  );

export default router;
