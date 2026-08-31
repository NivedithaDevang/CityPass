import express from "express";
import {
	getUsers,
	addUser,
	updateUser
} from "../../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", getUsers);

userRouter.post("/", addUser);

userRouter.put("/:id", updateUser);

export default userRouter; 