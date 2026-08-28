import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { findUserByEmail } from "../models/authModel.js";

export const loginUser = (
    req: Request,
    res: Response
) => {
    const { email, password } = req.body;

    findUserByEmail(email, async (err, user) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to login"
            });
        }

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
                message: "Invalid email or password"
            });
        }

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
};