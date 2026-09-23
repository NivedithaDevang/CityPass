import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import db from "../config/database.js";
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

        // Get JWT from HttpOnly cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const decoded = jwt.verify(
            token,
            JWT_SECRET as string
        ) as AuthPayLoad;

        const [rows] = await db.query<TokenVersionRow[]>(
            "SELECT token_version FROM users WHERE id = ?",
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        const currentTokenVersion = rows[0].token_version;

        if (decoded.token_version !== currentTokenVersion) {
            return res.status(401).json({
                message: "Token is no longer valid"
            });
        }

        req.user = decoded;

        next();

    } catch (error) {
        console.log("Auth error: ", error);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};