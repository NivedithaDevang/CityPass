import express from "express";

import {
  getUser,
  getUsers,
  updateProfile,
  changePassword,
  deactivateAccount,
  reactivateAndLogin,
} from "../../controllers/userController.js";

import { authenticate } from "../../middleware/authMiddleware.js";
import upload from "../../middleware/upload.js";

const userRouter = express.Router();

userRouter.get(
  "/userdetails",
  authenticate,
  getUser
);

userRouter.patch(
  "/userdetails",
  authenticate,
  upload.single("profile_image"),
  updateProfile
);

userRouter.patch(
  "/password",
  authenticate,
  changePassword
);

userRouter.patch(
  "/deactivate",
  authenticate,
  deactivateAccount
);
userRouter.post(
  "/reactivate-login",
  reactivateAndLogin
);

userRouter.get(
  "/",
  authenticate,
  getUsers
);

export default userRouter;