import { Router } from "express";
import { loginUser, registerUser } from "../../controllers/authController.js";
import { validateRegister, validateLogin } from "../../validators/authValid.js";

const router = Router();

router.post("/login", validateLogin, loginUser);
router.post("/register", validateRegister, registerUser);
export default router;