import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../config/database.js";
import { saltRounds } from "../config/env.js";
import { createUser, findUserByEmail } from "../models/authModel.js";
import { generateUserToken } from "../middleware/tokenMiddleware.js";


//registering a new user
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);


         //register user and return token
        const result = await createUser({
            name,
            email,
            password: hashedPassword,
            role: "USER",
        } as Parameters<typeof createUser>[0]);

        const userId = Number(result?.insertId ?? 0);
        const token = generateUserToken(userId, res, {
            id: userId,
            email,
            role: "USER",
            token_version: 0
        });

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: userId,
                name,
                email,
                role: "USER"
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
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Email id does not exist",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Entered password is incorrect",
      });
    }

    // Intercept inactive accounts before issuing credentials
    if (user.status === "INACTIVE") {
      return res.status(403).json({
        code: "ACCOUNT_INACTIVE",
        message: "Your account is currently deactivated.",
        userId: user.id,
      });
    }

    // Login
    generateUserToken(user.id, res, {
      id: user.id,
      email: user.email,
      role: user.role,
      token_version: user.token_version ?? 0,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.log("login error: ", err);
    res.status(500).json({
      message: "Unable to login",
    });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (userId) {
            await db.query(
                `UPDATE users SET token_version = token_version + 1 WHERE id = ?`,
                [userId]
            );
        }
    } catch (err) {
        console.log("logout error: ", err);
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: "lax" as const,
        path: "/"
    };

    // Clear both possible cookie names
    res.clearCookie("userToken", cookieOptions);
    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
        message: "Logout successful"
    });
};



