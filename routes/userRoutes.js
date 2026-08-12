import express from "express";
import { singleUpload } from "../middleware/multer.js";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";
import { userLogin } from "../controller/userController.js";

const router = express.Router();

router.route("/user/login").post(userLogin);

export default router;
