import express from "express";

import {
  getUser,
  getUsers,
  updateProfile,
  changePassword,
  reactivateAccount,
  deactivateAccount,
  reactivateAndLogin,
} from "../../controllers/userController.js";

import { authenticate } from "../../middleware/authMiddleware.js";
import { uploadAvatar } from "../../middleware/upload.js";

const userRouter = express.Router();

userRouter.get(
  "/userdetails",
  authenticate,
  getUser
);

userRouter.patch(
  "/userdetails",
  authenticate,
  uploadAvatar.single("profile_image"),
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

userRouter.patch(
  "/reactivate/:id",
  reactivateAccount
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