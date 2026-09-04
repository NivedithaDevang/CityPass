import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthPayLoad } from "../types/auth.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayLoad         
        }
    }
}


export const authenticate = (
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
            process.env.JWT_SECRET as string
        ) as AuthPayLoad;

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
jwt.verify(req.token, process.env.JWT_SECRET, (err, authorizedData) => {
            if(err){
                //If error send Forbidden (403)
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            else {
                req.user_id = authorizedData.id;
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