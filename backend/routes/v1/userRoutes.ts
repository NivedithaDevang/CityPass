import express from "express";
import {
	getUsers,
	addUser,
	updateUser
} from "../../controllers/userController.js";

const userRouter = express.Router();

//oonly admin can access the get users 
//add getUserById route using token
userRouter.get("/users", getUsers);

userRouter.post("/adduser", addUser);

userRouter.put("/updateuser", updateUser);

export default userRouter; 