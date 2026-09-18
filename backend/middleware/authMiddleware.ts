import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../config/database.js";
import { JWT_SECRET } from "../config/env.js";
import { AuthPayLoad } from "../types/auth.js";

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

        const [rows] = await db.query<any[]>(
            "SELECT token_version from users where id = ?",
            [decoded.id]
        );

        if(rows.length === 0){
            return res.status(401).json({
                message: "User not found"
            })
        }

        const currentTokenVersion = rows[0].token_version;
        if(decoded.token_version !== currentTokenVersion){
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


//token validation
export const checkToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const header = req.headers['authorization'];
    if(typeof header !== 'undefined'){
        const bearer = header.split(' ');
        const token = bearer[1];
        

        req.token = token;
        next();
    }
    else{
        res.sendStatus(403)
    }
}

export const validateToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.token) {
        return res.sendStatus(403);
    }

    const token = req.token;
    if (!JWT_SECRET) {
        return res.sendStatus(500);
    }

    jwt.verify(token, JWT_SECRET, (err, authorizedData) => {
            if(err || !authorizedData || typeof authorizedData === "string"){
                //If error send Forbidden (403)
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            else {
                const payload = authorizedData as AuthPayLoad;
                req.user_id = payload.id;
                  console.log(authorizedData);
                console.log('SUCCESS: Connected to protected route');
                next();
            //     //If token is successfully verified, we can send the autorized data 
            //     res.json({
            //         message: 'Successful log in',
            //         authorizedData
            //     });
          
            }
        })}