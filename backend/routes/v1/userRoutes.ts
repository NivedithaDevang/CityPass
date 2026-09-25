import express from "express";
import { uploadAvatar } from "../../middleware/upload.js";
import {
  updateProfile,
  changePassword,
  reactivateAccount,
  deactivateAccount,
  getUser,
  reactivateAndLogin
} from "../../controllers/userController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const userRouter = express.Router();

userRouter.get("/userdetails", authenticate, getUser);

// Add uploadAvatar.single("avatar") here
userRouter.patch(
  "/userdetails",
  authenticate,
  uploadAvatar.single("avatar") as unknown as express.RequestHandler,
  updateProfile
);

userRouter.patch("/password", authenticate, changePassword);
userRouter.put("/deactivate", authenticate, deactivateAccount);
userRouter.put("/:id/reactivate", authenticate, reactivateAccount);
userRouter.post("/reactivate-login", reactivateAndLogin);

export default userRouter;