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
import { validateIdParam } from "../../validators/idValidator.js";

const userRouter = express.Router();

userRouter.get("/profile", authenticate, getUser);

// Add uploadAvatar.single("avatar") here
userRouter.patch(
  "/profile",
  authenticate,
  uploadAvatar.single("avatar") as unknown as express.RequestHandler,
  updateProfile
);

userRouter.patch("/password", authenticate, changePassword);
userRouter.put("/deactivate", authenticate, deactivateAccount);
userRouter.put("/:id/reactivate", validateIdParam, authenticate, reactivateAccount);
userRouter.post("/reactivate-login", reactivateAndLogin);

export default userRouter;