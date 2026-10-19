
import { Request, Response, NextFunction } from "express";
import { db } from "../config/database.js";
import AppError from "../types/appError.js";

import {
  getEventTickets,
  createCustomEventTicket,
  updateEventTicket,
  deleteEventTicket,
} from "../models/eventTicketModel.js";

import { getOrganiserByUserId } from "../models/organiserModel.js";
import { validateId } from "../validators/idValidator.js";

// Check whether the event belongs to the authenticated organiser.
const getOwnedEvent = async (
  eventId: number,
  userId: number
): Promise<boolean> => {
  const organiser = await getOrganiserByUserId(userId);

  if (!organiser) {
    return false;
  }

  const [rows] = await db.execute(
    `SELECT id
     FROM events
     WHERE id = ? AND organizer_id = ?
     LIMIT 1`,
    [eventId, organiser.id]
  );

  return Array.isArray(rows) && rows.length > 0;
};

// GET /v1/events/:eventId/tickets
export const getTicketsForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = validateId(req.params.eventId);

    const tickets = await getEventTickets(eventId);

    return res.status(200).json({
      success: true,
      message: "Event tickets fetched successfully",
      tickets,
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
          "A ticket with this name already exists for the event",
          409
        )
      );
    }

    return next(error);
  }
};

// POST /v1/organisers/events/:eventId/tickets/custom
export const addCustomEventTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = validateId(req.params.eventId);

    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      throw new AppError("Authentication required", 401);
    }

    const userId = validateId(authenticatedUserId);

    const { name, description, price } = req.body;

    if (!(await getOwnedEvent(eventId, userId))) {
      throw new AppError(
        "You cannot modify tickets for this event",
        403
      );
    }

    const numericPrice = Number(price);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      price === undefined ||
      price === null ||
      price === "" ||
      typeof price === "boolean" ||
      (typeof price !== "number" && typeof price !== "string") ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      throw new AppError(
        "A valid ticket name and non-negative price are required",
        400
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      throw new AppError(
        "Ticket description must be a string",
        400
      );
    }

    const result = await createCustomEventTicket(
      eventId,
      name.trim(),
      typeof description === "string"
        ? description.trim() || null
        : null,
      numericPrice
    );

    return res.status(201).json({
      success: true,
      message: "Custom ticket created successfully",
      eventTicketId: result.insertId,
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
          "A ticket with this name already exists for the event",
          409
        )
      );
    }

    return next(error);
  }
};

// PATCH /v1/organisers/events/:eventId/tickets/:ticketId
export const editCustomEventTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = validateId(req.params.eventId);
    const ticketId = validateId(req.params.ticketId);
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      throw new AppError("Authentication required", 401);
    }

    const userId = validateId(authenticatedUserId);
    if (!(await getOwnedEvent(eventId, userId))) {
      throw new AppError("You cannot modify tickets for this event", 403);
    }

    const { name, description, price } = req.body;
    const numericPrice = Number(price);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      price === undefined ||
      price === null ||
      price === "" ||
      typeof price === "boolean" ||
      (typeof price !== "number" && typeof price !== "string") ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      throw new AppError(
        "A valid ticket name and non-negative price are required",
        400
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      throw new AppError("Ticket description must be a string", 400);
    }

    const result = await updateEventTicket(
      eventId,
      ticketId,
      name.trim(),
      typeof description === "string" ? description.trim() || null : null,
      numericPrice
    );

    if (result.affectedRows === 0) {
      throw new AppError("Ticket not found for this event", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Event ticket updated successfully",
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
          "A ticket with this name already exists for the event",
          409
        )
      );
    }

    return next(error);
  }
};

// DELETE /v1/organisers/events/:eventId/tickets/:ticketId
export const removeCustomEventTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = validateId(req.params.eventId);
    const ticketId = validateId(req.params.ticketId);
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      throw new AppError("Authentication required", 401);
    }

    const userId = validateId(authenticatedUserId);
    if (!(await getOwnedEvent(eventId, userId))) {
      throw new AppError("You cannot modify tickets for this event", 403);
    }

    const result = await deleteEventTicket(eventId, ticketId);

    if (result.affectedRows === 0) {
      throw new AppError("Ticket not found for this event", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Event ticket removed successfully",
    });
  } catch (error) {
    return next(error);
  }
};
