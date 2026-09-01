import {
    getAllUsers,
    createUser,
    updateUser as updateUserModel
} from "../models/userModel.js";
import { NextFunction, Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { saltRounds } from "../config/env.js";


//for getting all users

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const results = await getAllUsers();

        res.status(200).json({
            message: "Users fetched successfully",
            users: results
        });
    } catch (err) {
        next(err);
    }
};

//for posting new user
export const addUser = async (req: Request, res: Response, next: NextFunction) => {
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
            role
        });

        const token = jwt.sign(
            {
                id: result?.insertId,
                role
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "1h"
            }
        );

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: result?.insertId,
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


//for updating user details
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.params.id);
        const { name, email, password, role } = req.body;


        //change to token based authentication and authorization later
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "A valid user id is required"
            });
        }

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "name, email, password, and role are required"
            });
        }

        const result = await updateUserModel(userId, { name, email, password, role });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "User updated successfully",
            userId
        });
    } catch (err) {
        next(err);
    }
};

