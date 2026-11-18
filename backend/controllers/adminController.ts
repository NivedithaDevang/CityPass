import { Request, Response, NextFunction } from "express";
import {
  approveOrganiserRequest,
  rejectOrganiserRequest,
} from "../models/adminModel.js";
import { getOrganizerRequestById } from "../models/organiserRequestModel.js";
import { ADMIN_SECRET_KEY } from "../config/env.js";
import AppError from "../types/appError.js";
import { validateId } from "../validators/idValidator.js";


export const verifySuperAdminKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to access this action.", 403);
    }

    if (!ADMIN_SECRET_KEY) {
      throw new AppError("Admin verification is temporarily unavailable. Please try again later.", 503);
    }

    if (req.body?.secretKey !== ADMIN_SECRET_KEY) {
      throw new AppError("P", 401);
    }

    return res.status(200).json({
      success: true,
      message: "Authorization successful. Proceeding with admin request.",
    });
  } catch (err) {
    next(err);
  }
};

export const approveOrganiser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestId = validateId(req.params.id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      throw new AppError("No organiser request found with the provided ID.", 400);
    }

    const { status, reason } = req.body ?? {};

    if (status !== "APPROVED" && status !== "REJECTED") {
      throw new AppError("Invalid request status provided. Expected 'APPROVED' or 'REJECTED'.", 400);
    }

    if (status === "APPROVED") {
      await approveOrganiserRequest(requestId);
    } else {
      if (typeof reason !== "string" || !reason.trim()) {
        throw new AppError("Please specify why this request is being rejected.", 400);
      }

      if (reason.trim().length > 500) {
        throw new AppError("Rejection reason cannot exceed 500 characters", 400);
      }

      const request = await getOrganizerRequestById(requestId);
      if (!request) {
        throw new AppError("Organiser request not found", 404);
      }
      if (request.status !== "PENDING") {
        throw new AppError("Only pending organiser requests can be rejected", 409);
      }

      const result = await rejectOrganiserRequest(requestId, reason.trim());
      if (result.affectedRows === 0) {
        throw new AppError("This request is no longer pending", 409);
      }
    }

    return res.status(200).json({
      success: true,
      message:
        status === "APPROVED"
          ? "The organiser request has been approved and account access granted."
          : "The organiser request has been rejected, and the applicant has been notified.",
      status,
      requestId,
    });
  } catch (err) {
    next(err);
  }
};