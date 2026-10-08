import {
  getUserById,
  getAllUsers,
  updatePassword,
  updateUserProfile,
  getUserAuthByEmail,
  reactivateUser
} from "../models/userModel.js";
import cloudinary from "../config/cloudinary.js";
import {
  NextFunction,
  Request,
  Response,
} from "express";
import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import { saltRounds } from "../config/env.js";
import { db } from "../config/database.js";
import { generateUserToken } from "../middleware/tokenMiddleware.js";

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (userId === undefined) {
      return res.status(401).json({
        message: "User authentication is required",
      });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (err) {
    next(err);
  }
};


export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid user id",
      });
    }

    const {
      name,
      phone,
      city_id,
      dob,
      gender,
    } = req.body;

    if (
      !name ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      return res.status(400).json({
        message: "Name cannot exceed 100 characters",
      });
    }

    if (
      phone &&
      (typeof phone !== "string" ||
        !/^\d{10}$/.test(phone))
    ) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits",
      });
    }

    if (dob) {
      const dobPattern = /^\d{4}-\d{2}-\d{2}$/;

      if (!dobPattern.test(dob)) {
        return res.status(400).json({
          message: "Invalid date of birth",
        });
      }

      const [year, month, day] = dob
        .split("-")
        .map(Number);

      const dobDate = new Date(
        year,
        month - 1,
        day
      );

      const validDate =
        dobDate.getFullYear() === year &&
        dobDate.getMonth() === month - 1 &&
        dobDate.getDate() === day;

      if (!validDate) {
        return res.status(400).json({
          message: "Invalid date of birth",
        });
      }

      if (dob > "2015-12-31") {
        return res.status(400).json({
          message:
            "Date of birth must be 31 December 2015 or earlier",
        });
      }
    }

    if (
      gender &&
      !["MALE", "FEMALE", "OTHER"].includes(gender)
    ) {
      return res.status(400).json({
        message: "Invalid gender",
      });
    }

    let parsedCityId: number | null = null;

    if (city_id) {
      parsedCityId = Number(city_id);

      if (
        !Number.isInteger(parsedCityId) ||
        parsedCityId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid city",
        });
      }
    }
    let profileImage: string | null = null;

    const uploadedFile = req.file;

    if (uploadedFile) {
      const cloudinaryResult = await new Promise<any>(
        (resolve, reject) => {
          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder: "citypass/profile-images",
                public_id: `user_${userId}`,
                overwrite: true,
                resource_type: "image",
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );

          stream.end(uploadedFile.buffer);
        }
      );

      profileImage = cloudinaryResult.secure_url;
    }

    const result = await updateUserProfile(
      userId,
      {
        name: trimmedName,
        phone: phone || null,
        city_id: parsedCityId,
        dob: dob || null,
        gender: gender || null,
        profile_image: profileImage,
      }
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updatedUser = await getUserById(userId);

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        message: "Phone number already exists",
      });
    }

    next(err);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid user id",
      });
    }

    const {
      newPassword,
      confirmPassword,
    } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Both fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      saltRounds
    );

    const result = await updatePassword(
      userId,
      hashedPassword
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

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
        message: "Invalid user id",
      });
    }

    if (
      !reason ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return res.status(400).json({
        message: "A deactivation reason is required",
      });
    }

    const Reason = reason.trim().slice(0, 500);

    const sql = `
      UPDATE users
      SET
        status = 'INACTIVE',
        deactivated_at = NOW(),
        deactivation_reason = ?,
        token_version = token_version + 1
      WHERE id = ?
    `;

    const [result] =
      await db.query<ResultSetHeader>(
        sql,
        [Reason, userId]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const cookieOptions = {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    res.clearCookie(
      "userToken",
      cookieOptions
    );

    res.clearCookie(
      "token",
      cookieOptions
    );

    return res.status(200).json({
      message: "Account deactivated successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const reactivateAndLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await getUserAuthByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status == "ACTIVE") {
      return res.status(400).json({ message: "Account is already active" });
    }

    const { token_version: updatedTokenVersion } = await reactivateUser(user.id);

    generateUserToken(user.id, res, {
      id: user.id,
      email: user.email,
      role: user.role,
      token_version: updatedTokenVersion,
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