import express from "express";
import {
	getUsers,
	addUser,
	updateUser,
	deleteUser
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", getUsers);

userRouter.post("/", addUser);

userRouter.put("/:id", updateUser);

userRouter.delete("/:id", deleteUser);

export default userRouter; 