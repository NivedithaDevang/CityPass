import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser as updateUserModel,
    updatePassword
} from "../models/userModel.js";
import { NextFunction, Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { saltRounds } from "../config/env.js";
import { checkAdminRole } from "../middleware/roleMiddleware.js";
import { checkToken, validateToken } from "../middleware/authMiddleware.js";
import { generateToken } from "../middleware/tokenMiddleware.js";
import { dbConfig } from "../config/database.js";

//getting all users only if role is admin

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

//get user by id
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        console.log(userId); 
        
        // Number(req.params.id);

        // if (!Number.isInteger(userId) || userId <= 0) {
        //     return res.status(400).json({
        //         message: "A valid user id is required"
        //     });
        // }

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        

        res.status(200).json({
            message: "User fetched successfully",
            user
        });
    } catch (err) {
        console.log(err);
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
            role,
        } as Parameters<typeof createUser>[0]);

        const userId = Number(result?.insertId ?? 0);
        const token = generateToken(userId, role, "1h");

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

        const result = await updateUserModel(userId, {
            name, email, password, role
                } as Parameters<typeof updateUserModel>[1]);

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

// Update logged-in user's profile from Settings
export const updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = Number(req.user?.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Invalid user id"
            });
        }

        const { name, email, phone, dob, gender } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and email are required"
            });
        }

        const sql = `
            UPDATE users
            SET name = ?, email = ?, phone = ?, dob = ?, gender = ?
            WHERE id = ?
        `;

        const [result] = await dbConfig.query<ResultSetHeader>(
            sql,
            [
                name, email, phone || null, dob || null, gender || null,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const updatedUser = await getUserById(userId);

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
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

//updating password
export const changePassword = async(req: Request, res: Response, next: NextFunction) => {
    try{
        const userId = Number(req.user?.id);
        if(!Number.isInteger(userId) || userId <= 0){
            return res.status(401).json({
                message: "Invalid user id"
            });
        }

        const { newPassword, confirmPassword } = req.body;
        if (!newPassword || !confirmPassword){
            return res.status(400).json({
                message : "both the field are required"
            });
        }
        if (newPassword !== confirmPassword){
            return res.status(400).json({
                message : "passwords do not match"
            })
        }

        const hashedPassword = await bcrypt.hash( newPassword, saltRounds);
        const result = await updatePassword(
            userId, hashedPassword
        );
        if(result.affectedRows === 0){
            return res.status(404).json({
                message : "user not found"
            })

        }
        res.status(200).json({
            message : "password updated succesfully"
        })
    }
    catch(err){
        next(err);
    }
}

// Reactivate logged-in user's account
export const reactivateAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "A valid user id is required"
            });
        }

        const sql = ` UPDATE users SET status = 'ACTIVE'  WHERE id = ? `;

        const [result] = await dbConfig.query<ResultSetHeader>(
            sql,
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Account reactivated successfully"
        });

    } catch (err) {
        next(err);
    }
};


// Inactivate logged-in user's account
export const deactivateAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = Number(req.user?.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Invalid user id"
            });
        }

        const sql = `UPDATE users SET status = 'INACTIVE' WHERE id = ? `;

        const [result] = await dbConfig.query<ResultSetHeader>(
            sql,
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Account deactivated successfully"
        });

    } catch (err) {
        next(err);
    }
};


//for getting user details(profile)
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.user?.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (err) {
        res.status(500).json({
            message: "Unable to fetch profile"
        });
    }
};