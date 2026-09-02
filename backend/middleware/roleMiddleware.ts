import { Request, Response, NextFunction } from "express";
import { getUsers } from "../controllers/userController.js";
//middleware to check if the role is admin , only then getting all users
export const checkAdminRole = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            message: "Access denied. Admins only."
        });
    }
    if (req.user?.role === "ADMIN") {
        return res.status(200).json({
            message: "Access granted. Admins only.",
            users: getUsers
        });
    }
    next();
};

