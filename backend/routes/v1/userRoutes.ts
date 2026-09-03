import express from "express";
import {
	getUsers,
	addUser,
	updateUser,
	getUser
} from "../../controllers/userController.js";
import { authenticate, checkToken, validateToken } from "../../middleware/authMiddleware.js";
import { checkAdminRole } from "../../middleware/roleMiddleware.js";
import { validateRegister } from "../../validators/authValid.js";

const userRouter = express.Router();

//add getUserById route using token
// userRouter.get("/user/:id", authenticate, getUser);

//get all users only if the user is admin
// userRouter.get("/admin/users", authenticate, checkAdminRole, getUsers);

// userRouter.post("/adduser", addUser);

// userRouter.put("/updateuser", updateUser);

//get particular user details by passing the token through header
userRouter.get("/userdetails", checkToken, validateToken, getUser);


export default userRouter; 