import { Router } from "express";
import { loginUser, registerUser } from "../../controllers/authController.js";
import { validateRegister, validateLogin } from "../../validators/authValid.js";
import { verifyRole } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authMiddleware.js";
const router = Router();


router.get("/admin", authenticate, verifyRole(["admin"]), (req, res) => {
    res.status(200).json({
        message: "Welcome, admin!"
    });
});

router.get("/user", authenticate, verifyRole(["user"]), (req, res) => {
    res.status(200).json({
        message: "Welcome, user!"
    });
});
router.post("/login", validateLogin, loginUser);
router.post("/register", validateRegister, registerUser);
export default router;