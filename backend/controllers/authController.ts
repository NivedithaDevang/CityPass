import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../config/database.js";
import { saltRounds } from "../config/env.js";
import { createUser, findUserByEmail } from "../models/authModel.js";
import { generateUserToken } from "../middleware/tokenMiddleware.js";


//registering a new user
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Name, email, password, and role are required"
            });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);


         //register user and return token
        const result = await createUser({
            name,
            email,
            password: hashedPassword,
            role,
        } as Parameters<typeof createUser>[0]);

        const userId = Number(result?.insertId ?? 0);
        const token = generateUserToken(userId, res, {
            id: userId,
            email,
            role,
            token_version: 0
        });

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: userId,
                name,
                email,
                role
            }
        });
    } catch (err: any) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Email already exists"
            });
        }
        next(err);
    }
};


//for logging in a user
export const loginUser = async (
    req: Request,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

      if (!isPasswordValid) {
    return res.status(401).json({
        message: "Invalid password"
    });
}

        generateUserToken(user.id, res, "1hr");

        //"token" means the cookie name and given the same in the middleware also
        //token means the jwt value name
        //httpOnly : true means JS cannot access this cookie
        //lax means send the cookies in citypass but not when other website tries to access citypass backend

       

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (err) {
        console.log("login error: ", err)
        res.status(500).json({
            message: "Unable to login"
        });
    }
};

export const logoutUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (userId) {
            await db.query(
                `update users set token_version = token_version + 1 where id = ?`,
                [userId]
            );
        }
    } catch (err) {
        console.log("logout error: ", err);
    }

    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
    });

    res.status(200).json({
        message: "Logout successful"
    });
};



