import { Request, Response, NextFunction } from "express";
import AppError from "../types/appError.js";
import {
  getAllOrganisers,
  getOrganiserByUserId,
} from "../models/organiserModel.js";
import { getEventsByOrganiser } from "../models/eventModel.js";
import { getBookingsByOrganiserId } from "../models/bookingModel.js";
import { validateId } from "../validators/idValidator.js";

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

// GET /organisers/my-events
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

// GET /organisers/my-bookings
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