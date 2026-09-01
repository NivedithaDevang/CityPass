import { Router } from "express";
import { loginUser, registerUser } from "../../controllers/authController.js";
import { validateLogin } from "../../service/authValidator.js";

const router = Router();

router.post("/login", validateLogin, loginUser);
router.post("/register", registerUser);
export default router;