import {
    getAllUsers,
    createUser,
    updateUser as updateUserModel,
    removeUser
} from "../models/userModel.js";
import { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";


//for getting all users

export const getUsers = (req: Request, res: Response) => {
    
    getAllUsers((err: Error | null, results?: any[]) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch users",
                error: err
            });
        }

        res.status(200).json({
            message: "Users fetched successfully",
            users: results
        });
    });
};

//for posting new user
export const addUser = async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
     if (!name || !email || !password || !role) {
        return res.status(400).json({
            message: "Name, email, password, and role are required"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    createUser(
        { name, email, password: hashedPassword, role },
            (err: any, result) => {
            if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Email already exists"
                });
            }
                return res.status(500).json({
                    message: "Unable to create user"
                });
            }

            res.status(201).json({
                message: "User created successfully",
                userId: result?.insertId
            });
        }
    );
};


//for updating user details
export const updateUser = (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    const { name, email, password, role } = req.body;

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

    updateUserModel(userId, { name, email, password, role }, (err: any, result: ResultSetHeader) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to update user"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "User updated successfully",
            userId
        });
    });
};

//deleting a user

export const deleteUser = (req: Request, res: Response) => {
    const userId = Number(req.params.id);

    removeUser(userId, (err: any, result: ResultSetHeader) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to delete user"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "User deleted successfully"
        });
    });
};