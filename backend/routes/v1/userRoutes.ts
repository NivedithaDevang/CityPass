import express from "express";
import {
	updateProfile,
	changePassword,
	reactivateAccount,
	deactivateAccount,
	getUser
} from "../../controllers/userController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const userRouter = express.Router();


userRouter.get("/userdetails", authenticate, getUser);
userRouter.patch("/userdetails", authenticate, updateProfile);
userRouter.patch("/password", authenticate, changePassword);
userRouter.put("/deactivate", authenticate, deactivateAccount);

userRouter.put("/:id/reactivate", authenticate, reactivateAccount);

export default userRouter; 