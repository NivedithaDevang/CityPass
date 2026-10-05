import { Router } from "express";
import { handleValidation } from "../../middleware/validate.js";
import { validateRegister, validateLogin } from "../../validators/authValid.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  getCurrentUser,
} from "../../controllers/authController.js";
const router = Router();

router.post("/login", validateLogin, handleValidation, loginUser);
router.post("/register", validateRegister, handleValidation, registerUser);
router.post("/logout", authenticate, logoutUser);
router.get("/profile", authenticate, getCurrentUser);
export default router;

