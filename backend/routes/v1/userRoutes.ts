import express from "express";
import {
	getUsers,
	addUser,
	updateUser,
	getUser
} from "../../controllers/userController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { checkAdminRole } from "../../middleware/roleMiddleware.js";

const userRouter = express.Router();

//add getUserById route using token
userRouter.get("/user/:id", authenticate, getUser);

//get all users only if the user is admin
userRouter.get("/admin/users", authenticate, checkAdminRole, getUsers);

userRouter.post("/adduser", addUser);

userRouter.put("/updateuser", updateUser);

export default userRouter; 