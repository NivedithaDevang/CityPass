import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../models/authModel.js";
import jwt from "jsonwebtoken";
import { saltRounds } from "../config/env.js";


//registering a new user
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        console.log(req.body);

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await createUser({
            name,
            email,
            password: hashedPassword,
            role
        });

        if(result){

            res.status(201).json({
            message: "User registered successfully"
        });

        }
        else{
            res.status(400).json({
                message: "User registration failed"
            });
        }

        
    } catch (err) {
        res.status(500).json({
            message: "Unable to register user"
        });
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

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "1h"
            }
        );

        //"token" means the cookie name and given the same in the middleware also
        //token means the jwt value name
        //httpOnly : true means JS cannot access this cookie
        //lax means send the cookies in citypass but not when other website tries to access citypass backend

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({
            message: "Unable to login"
        });
    }
};



