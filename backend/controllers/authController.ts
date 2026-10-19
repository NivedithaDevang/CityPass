import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../config/database.js";
import { saltRounds } from "../config/env.js";
import { createUser, findUserByEmail } from "../models/authModel.js";
import { generateUserToken } from "../middleware/tokenMiddleware.js";
import AppError from "../types/appError.js";
import { validateId } from "../validators/idValidator.js";

// REGISTER USER
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, dob, password } = req.body;

    if (!name || !email || !dob || !password) {
      throw new AppError("Name, email , date of birth and password are required", 400);
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await createUser({
      name,
      email,
      dob,
      password: hashedPassword,
      role: "USER",
    } as Parameters<typeof createUser>[0]);

    const userId = Number(result?.insertId ?? 0);

    const token = generateUserToken(userId, res, {
      id: userId,
      email,
      role: "USER",
      city_id: null,
      token_version: 0,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: userId,
        name,
        email,
        dob,
        role: "USER",
        profile_image: null,
        status: "ACTIVE",
      },
    });
  } catch (err: any) {
    // Map MySQL unique index duplicate entry to 409 Conflict
    if (err.code === "ER_DUP_ENTRY") {
      return next(new AppError("Email already exists", 409));
    }
    next(err);
  }
};

// LOGIN USER
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await findUserByEmail(email);

    if (!user) {
      throw new AppError("Email id does not exist", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Entered password is incorrect", 401);
    }

    if (user.status === "INACTIVE") {
      throw new AppError("Your account is currently deactivated", 403);
    }

    generateUserToken(user.id, res, {
      id: user.id,
      email: user.email,
      role: user.role,
      city_id: user.city_id ?? null,
      token_version: user.token_version ?? 0,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profile_image: user.profile_image || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// LOGOUT USER
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authenticatedUserId = req.user?.id;

if (authenticatedUserId) {
  const userId = validateId(authenticatedUserId);

  await db.query(
    `
      UPDATE users
      SET token_version = token_version + 1
      WHERE id = ?
    `,
    [userId]
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

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    next(err);
  }
};

// GET CURRENT USER
export const getCurrentUser = async (
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

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const [rows]: any = await db.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        status,
        profile_image
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!rows || rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    const user = rows[0];

    if (user.status === "INACTIVE") {
      throw new AppError("Your account is currently deactivated", 403);
    }

    const userEmail = user.email.toLowerCase().trim();

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profile_image: user.profile_image || null,
        dob: user.dob,
        gender: user.gender
      },
    });
  } catch (err) {
    next(err);
  }
};