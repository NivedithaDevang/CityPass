import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthPayLoad } from "../types/auth.js";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as AuthPayLoad; 
        req.user = { ...decoded, id: String(decoded.id) };

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};