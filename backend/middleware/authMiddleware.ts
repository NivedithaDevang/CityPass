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


        if (!token) {
            return res.status(401).json({
                message: "No token provided. Authentication Required"
            });
        }

        const decoded = jwt.verify(
            token,
            JWT_SECRET as string
        ) as AuthPayLoad;

        const [rows] = await db.query<TokenVersionRow[]>(
            `SELECT token_version FROM users WHERE id = ?`,
            [decoded.id]
        );

        if (rows.length === 0) {

            return res.status(401).json({
                message: "User not found"
            });
        }

        const currentTokenVersion = rows[0].token_version ?? 0;

        if ((decoded.token_version ?? 0) !== currentTokenVersion) {
            return res.status(401).json({
                message: "Token is no longer valid"
            });
        }
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};