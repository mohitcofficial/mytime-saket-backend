import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";

import {
  createBooking,
  searchBookings,
  updateBooking,
  updateClient,
  deleteClient,
  addService,
  updateService,
  deleteService,
  deleteBooking,
  addClient,
  searchBooking,
  updateCompany,
  getRaisedInvoiceBookings,
} from "../controller/bookingController.js";
import { exportBookingsCSV } from "../controller/downloadController.js";

const router = express.Router();

router
  .route("/booking")
  .post(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation"),
    createBooking,
  );

router
  .route("/booking/:id")
  .put(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation"),
    updateBooking,
  );

router
  .route("/booking/:id")
  .get(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation", "accounts"),
    searchBooking,
  );

// GET /api/v1/bookings?companyName=ABC&clientName=Mohit&page=1&limit=20
router
  .route("/bookings")
  .get(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation", "accounts"),
    searchBookings,
  );

router
  .route("/booking/:id")
  .delete(
    isAuthenticated,
    authorizeRoles("super_admin", "admin"),
    deleteBooking,
  );

/*
|--------------------------------------------------------------------------
| CLIENTS
|--------------------------------------------------------------------------
*/

router
  .route("/booking/:bookingID/company/:companyID")
  .put(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation"),
    updateCompany,
  );

/*
|--------------------------------------------------------------------------
| CLIENTS
|--------------------------------------------------------------------------
*/
router
  .route("/booking/:bookingId/client")
  .post(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation"),
    addClient,
  );

router
  .route("/client/:clientId")
  .put(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation"),
    updateClient,
  )
  .delete(
    isAuthenticated,
    authorizeRoles("super_admin", "admin"),
    deleteClient,
  );

/*
|--------------------------------------------------------------------------
| SERVICES
|--------------------------------------------------------------------------
*/
router
  .route("/booking/:bookingId/service")
  .post(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation", "accounts"),
    addService,
  );

router
  .route("/service/:serviceId")
  .put(
    isAuthenticated,
    authorizeRoles("super_admin", "admin", "operation", "accounts"),
    updateService,
  )
  .delete(
    isAuthenticated,
    authorizeRoles("super_admin", "admin"),
    deleteService,
  );

router.route("/bookings/invoice").get(getRaisedInvoiceBookings);
router.route("/bookings/export").get(exportBookingsCSV);

export default router;
