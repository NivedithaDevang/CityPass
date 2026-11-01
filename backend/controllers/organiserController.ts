import { Request, Response, NextFunction } from "express";
import AppError from "../types/appError.js";
import {
  getAllOrganisers,
  getOrganiserByUserId,
  updateOrganiserProfile,
  deactivateOrganiser,
} from "../models/organiserModel.js";
import {
  getEventsByOrganiser,
  hasUpcomingOrganiserEvents,
} from "../models/eventModel.js";
import { getBookingsByOrganiserId } from "../models/bookingModel.js";
import { validateId } from "../validators/idValidator.js";

// GET /organisers/profile (Fetch logged-in organiser's profile)
export const getOrganiserProfile = async (
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
    const organiser = await getOrganiserByUserId(userId);

    if (!organiser) {
      throw new AppError("Organiser profile not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Organiser profile fetched successfully",
      profile: organiser,
    });
  } catch (err) {
    next(err);
  }
};

// GET /organisers
export const getOrganisers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organisers = await getAllOrganisers();

    return res.status(200).json({
      success: true,
      message: "Organisers fetched successfully",
      organisers,
    });
  } catch (err) {
    next(err);
  }
};

// GET /organisers/events
export const getMyEvents = async (
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
    const organiser = await getOrganiserByUserId(userId);

    if (!organiser) {
      throw new AppError("Organiser profile not found", 404);
    }

    const events = await getEventsByOrganiser(organiser.id);

    return res.status(200).json({
      success: true,
      message: "Organiser events fetched successfully",
      events,
    });
  } catch (err) {
    next(err);
  }
};

// GET /organisers/bookings
export const getMyBookings = async (
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
    const organiser = await getOrganiserByUserId(userId);

    if (!organiser) {
      throw new AppError("Organiser profile not found", 404);
    }

    const bookings = await getBookingsByOrganiserId(organiser.id);

    return res.status(200).json({
      success: true,
      message: "Organiser bookings fetched successfully",
      bookings,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /organisers/profile or /organisers/edit-org-profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Authentication required.",
      });
    }

    const userId = validateId(authenticatedUserId);
    const organiser = await getOrganiserByUserId(userId);

    if (!organiser) {
      return res.status(404).json({
        success: false,
        message: "Organiser profile not found.",
      });
    }

    const { stage_name, description } = req.body;

    if (!stage_name || typeof stage_name !== "string" || !stage_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Stage name is required.",
      });
    }

    const result = await updateOrganiserProfile(organiser.id, {
      stage_name: stage_name.trim(),
      description: (description || "").trim(),
    });

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes made to organiser profile.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Organiser profile updated successfully.",
      profile: {
        id: organiser.id,
        stage_name: stage_name.trim(),
        description: (description || "").trim(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /organisers/deactivate
export const deactivateOrganiserAccount = async (
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
    const organiser = await getOrganiserByUserId(userId);

    if (!organiser) {
      throw new AppError("Organiser profile not found", 404);
    }

    if (await hasUpcomingOrganiserEvents(organiser.id)) {
      throw new AppError(
        "You cannot deactivate your account while you have upcoming events. Cancel or complete them before trying again.",
        409
      );
    }

    const result = await deactivateOrganiser(organiser.id);

    if (result.affectedRows === 0) {
      if (await hasUpcomingOrganiserEvents(organiser.id)) {
        throw new AppError(
          "You cannot deactivate your account while you have upcoming events. Cancel or complete them before trying again.",
          409
        );
      }
      throw new AppError(
        "Organiser not found or account is already inactive",
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