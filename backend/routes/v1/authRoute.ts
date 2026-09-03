import { Router } from "express";
import { getUser } from "../../controllers/userController.js";
import { loginUser, registerUser } from "../../controllers/authController.js";
import { validateRegister, validateLogin } from "../../validators/authValid.js";
import { verifyRole } from "../../middleware/validate.js";
import { authenticate, checkToken, validateToken } from "../../middleware/authMiddleware.js";
const router = Router();

// router.get("/user/data", checkToken, validateToken, getUser);

// router.get("/admin", authenticate, verifyRole(["admin"]));

// router.get("/user", authenticate, verifyRole(["user"]));
// router.get("/profile", authenticate, getProfile);
router.post("/login", validateLogin, loginUser);
router.post("/register", validateRegister, registerUser);
export default router;

