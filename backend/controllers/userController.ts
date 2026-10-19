
import {
  getUserById,
  getAllUsers,
  updatePassword,
  updateUserProfile,
  getUserAuthByEmail,
  reactivateUser,
} from "../models/userModel.js";

import cloudinary from "../config/cloudinary.js";
import { NextFunction, Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import { saltRounds } from "../config/env.js";
import { db } from "../config/database.js";
import { generateUserToken } from "../middleware/tokenMiddleware.js";
import AppError from "../types/appError.js";
import { validateId } from "../validators/idValidator.js";

// GET /v1/users/userdetails
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      throw new AppError("Authentication required", 401);
    }

    const userId = validateId(authenticatedUserId);
    const user = await getUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /v1/users
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /v1/users/profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      throw new AppError("Authentication required", 401);
    }

    const userId = validateId(authenticatedUserId);

    const { name, phone, email, city_id, dob, gender } = req.body;

    // Validate name.
    if (typeof name !== "string" || !name.trim()) {
      throw new AppError("Name is required", 400);
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      throw new AppError("Name cannot exceed 100 characters", 400);
    }

    // Validate phone number when provided.
    if (
      phone !== undefined &&
      phone !== null &&
      phone !== "" &&
      (typeof phone !== "string" || !/^\d{10}$/.test(phone))
    ) {
      throw new AppError(
        "Phone number must be exactly 10 digits",
        400
      );
    }

    // Validate date of birth when provided.
    if (dob !== undefined && dob !== null && dob !== "") {
      if (typeof dob !== "string") {
        throw new AppError("Invalid date of birth", 400);
      }

      const dobPattern = /^\d{4}-\d{2}-\d{2}$/;

      if (!dobPattern.test(dob)) {
        throw new AppError("Invalid date of birth", 400);
      }

      const [year, month, day] = dob.split("-").map(Number);
      const dobDate = new Date(year, month - 1, day);

      const validDate =
        dobDate.getFullYear() === year &&
        dobDate.getMonth() === month - 1 &&
        dobDate.getDate() === day;

      if (!validDate) {
        throw new AppError("Invalid date of birth", 400);
      }

      if (dob > "2015-12-31") {
        throw new AppError(
          "Date of birth must be 31 December 2015 or earlier",
          400
        );
      }
    }

    // Validate gender when provided.
    if (
      gender !== undefined &&
      gender !== null &&
      gender !== "" &&
      (typeof gender !== "string" ||
        !["MALE", "FEMALE", "OTHER"].includes(gender))
    ) {
      throw new AppError("Please select a valid gender", 400);
    }

    // Validate city ID when provided.
    let parsedCityId: number | null = null;

    if (
      city_id !== undefined &&
      city_id !== null &&
      city_id !== ""
    ) {
      parsedCityId = validateId(city_id);
    }

    // Upload profile image if provided.
    let profileImage: string | null = null;
    const uploadedFile = req.file;

    if (uploadedFile) {
      const cloudinaryResult = await new Promise<{
        secure_url: string;
      }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "citypass/profile-images",
            public_id: `user_${userId}`,
            overwrite: true,
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              return reject(
                new AppError("Cloudinary upload failed", 502)
              );
            }

            resolve({
              secure_url: result.secure_url,
            });
          }
        );

        stream.end(uploadedFile.buffer);
      });

      profileImage = cloudinaryResult.secure_url;
    }

    const result = await updateUserProfile(userId, {
      name: trimmedName,
      email: email,
      phone: phone || null,
      city_id: parsedCityId,
      dob: dob || null,
      gender: gender || null,
      profile_image: profileImage,
    });

    if (result.affectedRows === 0) {
      throw new AppError("User not found", 404);
    }

    const updatedUser = await getUserById(userId);

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return next(
        new AppError("Phone number already exists", 409)
      );
    }

    return next(error);
  }
};

// PUT /v1/users/change-password
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      throw new AppError("Authentication required", 401);
    }

    const userId = validateId(authenticatedUserId);
    const { newPassword, confirmPassword } = req.body;

    if (
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !newPassword ||
      !confirmPassword
    ) {
      throw new AppError(
        "Both new password and confirm password are required",
        400
      );
    }

    if (newPassword !== confirmPassword) {
      throw new AppError("Passwords do not match", 400);
    }

    if (newPassword.length < 8 || newPassword.length > 20) {
      throw new AppError(
        "Password must be of atleast 8 characters",
        400
      );
    }

    // Strong password criteria checks
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~` ]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      throw new AppError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        400
      );
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      saltRounds
    );

    const result = await updatePassword(userId, hashedPassword);

    if (result.affectedRows === 0) {
      throw new AppError("User not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// POST /v1/users/deactivate
export const deactivateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      throw new AppError("Authentication required", 401);
    }

    const userId = validateId(authenticatedUserId);
    const { reason } = req.body;

    if (
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      throw new AppError(
        "Please provide a reason for deactivating your account",
        400
      );
    }

    if (reason.trim().length > 500) {
      throw new AppError(
        "Deactivation reason cannot exceed 500 characters",
        400
      );
    }

    const sql = `
      UPDATE users
      SET
        status = 'INACTIVE',
        deactivated_at = NOW(),
        deactivation_reason = ?,
        token_version = token_version + 1
      WHERE id = ?
        AND status = 'ACTIVE'
    `;

    const [result] = await db.query<ResultSetHeader>(sql, [
      reason.trim(),
      userId,
    ]);

    if (result.affectedRows === 0) {
      throw new AppError(
        "User not found or account is already inactive",
        404
      );
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    res.clearCookie("userToken", cookieOptions);
    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// POST /v1/users/reactivate
export const reactivateAndLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      throw new AppError(
        "Email and password are required",
        400
      );
    }

    const user = await getUserAuthByEmail(email.trim());

    if (!user) {
      throw new AppError(
        "Invalid email or password",
        401
      );
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      throw new AppError(
        "Invalid email or password",
        401
      );
    }

    if (user.status === "ACTIVE") {
      throw new AppError("Account is already active", 400);
    }

    const {
      token_version: updatedTokenVersion,
    } = await reactivateUser(user.id);

    generateUserToken(user.id, res, {
      id: user.id,
      email: user.email,
      role: user.role,
      token_version: updatedTokenVersion,
    });

    return res.status(200).json({
      success: true,
      message: "Account reactivated and logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: "ACTIVE",
      },
    });
  } catch (error) {
    return next(error);
  }
};
