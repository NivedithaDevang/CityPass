import {
    getAllUsers,
    getUserById,
    updateUser as updateUserModel,
    updatePassword
} from "../models/userModel.js";
import { NextFunction, Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import { saltRounds } from "../config/env.js";
import { db } from "../config/database.js";
import { generateUserToken } from "../middleware/tokenMiddleware.js";

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

        if (userId === undefined) {
            return res.status(401).json({
                message: "User authentication is required"
            });
        }
        
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
            user: result
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

        if (phone && (phone.length !== 10 || isNaN(Number(phone)))) {
            return res.status(400).json({
                message: "Phone number must be exactly 10 digits"
            });
        }

// Check if a profile image was uploaded and create its relative URL
        const profileImage = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

// Build the UPDATE query based on whether a new profile image was uploaded
        let sql: string;
        let params: any[];

// If a new profile image is uploaded, update the profile image along with other details
        if (profileImage) {
            sql = `
                UPDATE users
                SET name = ?, email = ?, phone = ?, dob = ?, gender = ?, profile_image = ?
                WHERE id = ?
            `;
            params = [
                name,
                email,
                phone || null,
                dob || null,
                gender || null,
                profileImage,
                userId
            ];
        } else {
            sql = `
                UPDATE users
                SET name = ?, email = ?, phone = ?, dob = ?, gender = ?
                WHERE id = ?
            `;
            params = [
                name,
                email,
                phone || null,
                dob || null,
                gender || null,
                userId
            ];
        }

        await db.query<ResultSetHeader>(sql, params);

        // Fetch the user after updating
        const updatedUser = await getUserById(userId);

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (err: unknown) {
        if (typeof err === "object" && err !== null && 
            "code" in err &&
            err.code === "ER_DUP_ENTRY") {
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

// Reactivate user's account
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

        const sql = `
            UPDATE users 
            SET status = 'ACTIVE', 
                deactivated_at = NULL 
            WHERE id = ?
        `;

        const [result] = await db.query<ResultSetHeader>(
            sql,
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
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
        const { reason } = req.body;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Invalid user id"
            });
        }

        if (!reason || typeof reason !== "string" || !reason.trim()) {
            return res.status(400).json({
                message: "A deactivation reason is required"
            });
        }

        const Reason = reason.trim().slice(0, 500);

        // Update status, timestamp, reason, and increment token_version to invalidate tokens
        const sql = `
            UPDATE users 
            SET status = 'INACTIVE', 
                deactivated_at = NOW(), 
                deactivation_reason = ?,
                token_version = token_version + 1
            WHERE id = ?
        `;

        const [result] = await db.query<ResultSetHeader>(
            sql,
            [Reason, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Clear auth cookies immediately
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/"
        };

        res.clearCookie("userToken", cookieOptions);
        res.clearCookie("token", cookieOptions);

        return res.status(200).json({
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

export const reactivateAndLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    const parsedId = Number(userId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        message: "A valid user id is required",
      });
    }

    // Fetch user details
    const [rows]: any = await db.query(
      `SELECT id, email, role, token_version FROM users WHERE id = ?`,
      [parsedId]
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
// Reactivation should only happen for an inactive account.
        if (user.status !== "INACTIVE") {
            return res.status(400).json({
                message: "Account is already active"
            });
        }

    // Set status to ACTIVE, clear deactivated_at, and update token_version
    await db.query(
      `UPDATE users 
       SET status = 'ACTIVE', 
           deactivated_at = NULL, 
           token_version = token_version + 1 
       WHERE id = ?`,
      [parsedId]
    );

    // Fetch the latest token_version after the update.
const [updatedRows] = await db.query<
    (RowDataPacket & {
        token_version: number;
    })[]
>(
    `
        SELECT token_version
        FROM users
        WHERE id = ?
    `,
    [parsedId]
);

const updatedTokenVersion = updatedRows[0]?.token_version;

if (updatedTokenVersion === undefined) {
    return res.status(404).json({
        message: "Unable to reactivate account"
    });
}

    // Generate cookie
    generateUserToken(user.id, res, {
      id: user.id,
      email: user.email,
      role: user.role,
      token_version: (user.token_version ?? 0) + 1,
    });

    return res.status(200).json({
      message: "Account reactivated and logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: "ACTIVE",
      },
    });
  } catch (err) {
    next(err);
  }
};