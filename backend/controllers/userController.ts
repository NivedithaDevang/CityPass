
import {
  getUserById,
  getAllUsers,
  updatePassword,
  updateUserProfile,
  getUserAuthByEmail,
  reactivateUser,
  deactivateUser
} from "../models/userModel.js";

import cloudinary from "../config/cloudinary.js";
import { NextFunction, Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../config/database.js";
import bcrypt from "bcrypt";
import { saltRounds } from "../config/env.js";
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

// GET /v1/admin/users/:id/details
export const getAdminUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = validateId(req.params.id);
    const [userRows] = await db.query<RowDataPacket[]>(
      `
        SELECT u.*, c.name AS city_name
        FROM users u
        LEFT JOIN cities c ON c.id = u.city_id
        WHERE u.id = ?
        LIMIT 1
      `,
      [userId]
    );

    const userRow = userRows[0];
    if (!userRow) {
      throw new AppError("User not found", 404);
    }

    const [bookingRows] = await db.query<RowDataPacket[]>(
      `
        SELECT
          b.id AS booking_id,
          b.pass_id AS event_id,
          b.event_ticket_id,
          b.number_of_tickets,
          b.total_amount,
          b.booking_date,
          b.status AS booking_status,
          e.name AS event_name,
          e.slug AS event_slug,
          e.event_date,
          e.time AS event_time,
          e.location,
          e.status AS event_status,
          ci.name AS city_name,
          c.name AS category_name,
          et.name AS ticket_name
        FROM bookings b
        LEFT JOIN events e ON e.id = b.pass_id
        LEFT JOIN cities ci ON ci.id = e.city_id
        LEFT JOIN categories c ON c.id = e.category_id
        LEFT JOIN event_tickets et
          ON et.id = b.event_ticket_id AND et.event_id = e.id
        WHERE b.user_id = ?
        ORDER BY b.booking_date DESC, b.id DESC
      `,
      [userId]
    );

    const [organizerRows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM organizers WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [userId]
    );
    const organizerRow = organizerRows[0] as Record<string, unknown> | undefined;

    let organizer = null;
    if (organizerRow) {
      const organizerId = Number(organizerRow.id);
      const [eventRows] = await db.query<
        Array<RowDataPacket & { id: number; status?: string }>
      >(
        `
          SELECT
            e.*,
            ci.name AS city_name,
            c.name AS category_name
          FROM events e
          LEFT JOIN cities ci ON ci.id = e.city_id
          LEFT JOIN categories c ON c.id = e.category_id
          WHERE e.organizer_id = ?
          ORDER BY e.id DESC
        `,
        [organizerId]
      );
      const [hostedBookingRows] = await db.query<RowDataPacket[]>(
        `
          SELECT
            b.id AS booking_id,
            b.pass_id AS event_id,
            b.number_of_tickets,
            b.total_amount,
            b.booking_date,
            b.status AS booking_status,
            u.name AS customer_name,
            u.email AS customer_email,
            et.name AS ticket_name
          FROM bookings b
          INNER JOIN events e ON e.id = b.pass_id
          LEFT JOIN users u ON u.id = b.user_id
          LEFT JOIN event_tickets et
            ON et.id = b.event_ticket_id AND et.event_id = e.id
          WHERE e.organizer_id = ?
          ORDER BY b.booking_date DESC, b.id DESC
        `,
        [organizerId]
      );
      const [requestRows] = await db.query<RowDataPacket[]>(
        `
          SELECT *
          FROM organizer_requests
          WHERE user_id = ?
          ORDER BY id DESC
        `,
        [userId]
      );

      const hostedBookings = hostedBookingRows as Array<
        Record<string, unknown>
      >;
      const events = eventRows.map((event) => {
        const eventBookings = hostedBookings.filter(
          (booking) => Number(booking.event_id) === Number(event.id)
        );
        const statusCounts = eventBookings.reduce<{ confirmed: number; cancelled: number }>(
          (counts, booking) => {
            const status = String(booking.booking_status || "").toUpperCase();
            if (status === "CONFIRMED") counts.confirmed += 1;
            if (status === "CANCELLED") counts.cancelled += 1;
            return counts;
          },
          { confirmed: 0, cancelled: 0 }
        );

        return {
          ...event,
          booking_count: eventBookings.length,
          confirmed_booking_count: statusCounts.confirmed,
          cancelled_booking_count: statusCounts.cancelled,
          bookings: eventBookings,
        };
      });

      const requestHistory = requestRows.map((row) => {
        const request = row as Record<string, unknown>;
        return {
          id: request.id,
          organization_name: request.organization_name,
          status: request.status,
          description: request.description,
          city_id: request.city_id,
          email: request.email,
          phone: request.phone,
          id_proof: request.id_proof,
          id_proof_file: request.ifproof_image ?? request.id_proof_file,
          rejection_reason: request.rejection_reason,
          created_at: request.created_at,
          updated_at: request.updated_at,
          approved_at: request.approved_at,
        };
      });
      const approvedRequest = requestHistory.find(
        (request) => request.status === "APPROVED"
      );

      organizer = {
        id: organizerRow.id,
        stage_name: organizerRow.stage_name,
        email: organizerRow.email,
        description: organizerRow.description,
        status: organizerRow.status,
        created_at: organizerRow.created_at,
        deactivated_at: organizerRow.deactivated_at,
        approved_at:
          approvedRequest?.approved_at ??
          approvedRequest?.updated_at ??
          organizerRow.created_at ??
          null,
        request_history: requestHistory,
        event_summary: {
          total: events.length,
          pending: events.filter((event) => event.status === "PENDING").length,
          approved: events.filter((event) => event.status === "APPROVED").length,
          rejected: events.filter((event) => event.status === "REJECTED").length,
          cancelled: events.filter((event) => event.status === "CANCELLED").length,
          completed: events.filter((event) => event.status === "COMPLETED").length,
        },
        events,
      };
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role,
      status: userRow.status,
      city_id: userRow.city_id,
      city_name: userRow.city_name,
      dob: userRow.dob,
      gender: userRow.gender,
      profile_image: userRow.profile_image,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
      deactivated_at: userRow.deactivated_at,
      deactivation_reason: userRow.deactivation_reason,
      bookings: bookingRows,
      booking_summary: {
        total: bookingRows.length,
        confirmed: bookingRows.filter(
          (booking) => booking.booking_status === "CONFIRMED"
        ).length,
        cancelled: bookingRows.filter(
          (booking) => booking.booking_status === "CANCELLED"
        ).length,
      },
      organizer,
    };

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
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

    const trimmedReason = reason.trim();

    if (trimmedReason.length > 500) {
      throw new AppError(
        "Deactivation reason cannot exceed 500 characters",
        400
      );
    }

    // Call the model function
    const result = await deactivateUser(userId, trimmedReason);

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
