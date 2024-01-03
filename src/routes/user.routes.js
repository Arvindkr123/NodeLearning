import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "./../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

//TODO:REGISTER
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

//TODO: LOGIN_ROUTE:
router.route("/login").post(loginUser);

//TODO: secured route
router.route("/logout").post(verifyJWT, logoutUser);

//:::::TODO: refresh token route
router.route("/refresh-token").post(refreshAccessToken);

export default router;
