import express from "express";
import {
	getUsers,
	addUser,
	updateUser,
	updateProfile,
	changePassword,
	reactivateAccount,
	deactivateAccount,
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
// userRouter.get("/userdetails", checkToken, validateToken, getUser);

userRouter.get("/userdetails", authenticate, getUser);
userRouter.patch("/userdetails", authenticate, updateProfile);
userRouter.patch("/password", authenticate, changePassword);
userRouter.put("/deactivate", authenticate, deactivateAccount);

userRouter.put("/:id/reactivate", authenticate, reactivateAccount);

export default userRouter; 