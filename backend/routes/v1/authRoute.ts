import { Router } from "express";
import { handleValidation } from "../../middleware/validate.js";
import { loginUser, logoutUser, registerUser } from "../../controllers/authController.js";
import { validateRegister, validateLogin } from "../../validators/authValid.js";
import { authenticate } from "../../middleware/authMiddleware.js";
const router = Router();

router.post("/login", validateLogin, handleValidation, loginUser);
router.post("/register", validateRegister, handleValidation, registerUser);
router.post("/logout", authenticate, logoutUser);
export default router;

