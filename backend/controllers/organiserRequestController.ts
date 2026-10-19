
import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../config/database.js";
import AppError from "../types/appError.js";

import {
  getAllRequests,
  getOrganizerRequestById,
  getActiveRequestByUserId,
  getLatestRequestByUserId,
  createRequest,
  resubmitRejectedRequest,
} from "../models/organiserRequestModel.js";

import { validateId } from "../validators/idValidator.js";

interface IdRow extends RowDataPacket {
  id: number;
}

// GET /v1/organiser-requests/status
export const getMyRequestStatus = async (
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
    const request = await getLatestRequestByUserId(userId);

    return res.status(200).json({
      success: true,
      status: request?.status ?? "NONE",
      rejection_reason: request?.rejection_reason ?? null,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /v1/organisers/requests
export const getRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await getAllRequests();

    return res.status(200).json({
      success: true,
      message: "Requests fetched successfully",
      requests: results,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /v1/organisers/requests/:id
export const getRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = validateId(req.params.id);
    const request = await getOrganizerRequestById(id);

    if (!request) {
      throw new AppError("Organizer request not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Organizer request fetched successfully",
      request,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /v1/organisers/requests
export const addRequest = async (
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

    const existing = await getActiveRequestByUserId(userId);

    if (existing) {
      throw new AppError(
        existing.status === "APPROVED"
          ? "You are already a registered organizer."
          : "You already have an organizer application pending review.",
        409
      );
    }

    const latestRequest = await getLatestRequestByUserId(userId);

    const organizationName =
      req.body.organization_name ?? req.body.stageName;

    const description = req.body.description;

    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";

    const phone =
      typeof req.body.phone === "string" ? req.body.phone.trim() : "";

    const idProof =
      typeof req.body.id_proof === "string"
        ? req.body.id_proof.trim().toUpperCase()
        : "";

    if (
      typeof organizationName !== "string" ||
      !organizationName.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !email ||
      !phone ||
      !idProof
    ) {
      throw new AppError(
        "All fields are required. Please fill in every field.",
        400
      );
    }

    const stageName = organizationName.trim();
    const cleanDescription = description.trim();

    if (cleanDescription.length < 10) {
      throw new AppError(
        "Description must be at least 10 characters long.",
        400
      );
    }

    if (cleanDescription.length > 300) {
      throw new AppError(
        "Description cannot exceed 300 characters.",
        400
      );
    }

  
    // Resolve city ID.
    let cityId: number;

    if (
      req.body.city_id !== undefined &&
      req.body.city_id !== null &&
      req.body.city_id !== ""
    ) {
      cityId = validateId(req.body.city_id);
    } else if (
      typeof req.body.city === "string" &&
      req.body.city.trim()
    ) {
      const [cityRows] = await db.query<IdRow[]>(
        `SELECT id
         FROM cities
         WHERE name = ?
         LIMIT 1`,
        [req.body.city.trim()]
      );

      if (cityRows.length === 0) {
        throw new AppError("Selected city does not exist.", 400);
      }

      cityId = cityRows[0].id;
    } else {
      throw new AppError("City is required.", 400);
    }


    // Confirm the selected city is active.
    
const [cityCheck] = await db.query<IdRow[]>(
  `SELECT id
   FROM cities
   WHERE id = ? AND is_active = 1
   LIMIT 1`,
  [cityId]
);

if (cityCheck.length === 0) {
  throw new AppError(
    "Selected city is inactive or does not exist.",
    400
  );
}


    const requestData = {
      user_id: userId,
      organization_name: stageName,
      description: cleanDescription,
      city_id: cityId,
      id_proof: idProof,
      email,
      phone,
      status: "PENDING",
    } as const;

    if (latestRequest?.status === "REJECTED") {
      const result = await resubmitRejectedRequest(
        latestRequest.id,
        userId,
        requestData
      );

      if (result.affectedRows === 0) {
        throw new AppError(
          "This rejected request can no longer be resubmitted. Refresh and try again.",
          409
        );
      }

      return res.status(200).json({
        success: true,
        message: "Organizer request resubmitted successfully!",
        requestId: latestRequest.id,
      });
    }

    const result = await createRequest(requestData);

    return res.status(201).json({
      success: true,
      message: "Organizer request submitted successfully!",
      requestId: result.insertId,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return next(
        new AppError(
          "An application with this email or identity proof already exists.",
          409
        )
      );
    }

    return next(error);
  }
};
