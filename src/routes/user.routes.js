import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "./../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // middleware
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  // controller
  registerUser
);

// LOGIN_ROUTE:
router.route("/login").post(loginUser);

// secured route
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
