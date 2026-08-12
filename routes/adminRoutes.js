import express from "express";
import {
  createAdmin,
  createUser,
  deactivateUser,
  deleteUser,
  getAllAdmins,
  getAllUsers,
  getMyProfile,
  getUserInfo,
  logout,
  adminLogin,
  updateUserProfile,
} from "../controller/adminController.js";
import { singleUpload } from "../middleware/multer.js";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/admin/create")
  .post(
    isAuthenticated,
    authorizeRoles("super_admin"),
    singleUpload,
    createAdmin,
  );
router
  .route("/user/create")
  .post(
    isAuthenticated,
    authorizeRoles("super_admin", "admin"),
    singleUpload,
    createUser,
  );
router
  .route("/user/deactivate/:id")
  .get(
    isAuthenticated,
    authorizeRoles("super_admin", "admin"),
    singleUpload,
    deactivateUser,
  );
router.route("/admin/login").post(adminLogin);
router
  .route("/admins")
  .get(isAuthenticated, authorizeRoles("super_admin", "admin"), getAllAdmins);

router
  .route("/users")
  .get(isAuthenticated, authorizeRoles("super_admin", "admin"), getAllUsers);
router
  .route("/user/:id")
  .delete(isAuthenticated, authorizeRoles("super_admin", "admin"), deleteUser);
router
  .route("/user/update/:id")
  .put(isAuthenticated, singleUpload, updateUserProfile);

router
  .route("/user/:id")
  .get(isAuthenticated, authorizeRoles("super_admin", "admin"), getUserInfo);
router.route("/me").get(isAuthenticated, getMyProfile);
router.route("/logout").get(logout);

export default router;
