import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { db } from "../config/database.js";
import { JWT_SECRET } from "../config/env.js";
import { AuthPayLoad } from "../types/auth.js";

type TokenVersionRow = RowDataPacket & {
    token_version: number;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayLoad;
            token?: string;
            user_id?: AuthPayLoad["id"];
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.userToken || req.cookies?.token;

        console.log("AUTH DEBUG");
        console.log("URL:", req.originalUrl);
        console.log("Cookies:", req.cookies);
        console.log("Token exists:", !!token);

        if (!token) {
            console.log("NO TOKEN");
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const decoded = jwt.verify(
            token,
            JWT_SECRET as string
        ) as AuthPayLoad;

        console.log("Decoded JWT:", decoded);

        const [rows] = await db.query<TokenVersionRow[]>(
            "SELECT token_version FROM users WHERE id = ?",
            [decoded.id]
        );

        console.log("DB token version:", rows[0]?.token_version);
        console.log("JWT token version:", decoded.token_version);

        if (rows.length === 0) {
            console.log("USER NOT FOUND");

            return res.status(401).json({
                message: "User not found"
            });
        }

        const currentTokenVersion = rows[0].token_version ?? 0;

        if ((decoded.token_version ?? 0) !== currentTokenVersion) {
            console.log("TOKEN VERSION MISMATCH");

            return res.status(401).json({
                message: "Token is no longer valid"
            });
        }

        req.user = decoded;

        console.log("AUTH SUCCESS");

        next();

    } catch (error) {
        console.error("AUTH ERROR:", error);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};