
import { Request, Response, NextFunction } from "express";
import { db } from "../config/database.js";
import {
  getTemplatesByEventCategory,
  getEventTickets,
  createCustomEventTicket,
  assignTemplateToEvent,
} from "../models/eventTicketModel.js";
import { getOrganiserByUserId } from "../models/organiserModel.js";

const getOwnedEvent = async (
  eventId: number,
  userId: number
): Promise<boolean> => {
  const organiser = await getOrganiserByUserId(userId);

  if (!organiser) return false;

  const [rows] = await db.execute(
    `SELECT id FROM events
     WHERE id = ? AND organizer_id = ?`,
    [eventId, organiser.id]
  );

  return Array.isArray(rows) && rows.length > 0;
};

// GET /v1/events/:eventId/ticket-templates
export const getEventTicketTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        message: "A valid event ID is required",
      });
    }

    const templates =
      await getTemplatesByEventCategory(eventId);

    return res.status(200).json({
      message: "Ticket templates fetched successfully",
      tickets: templates,
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/events/:eventId/tickets
export const getTicketsForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        message: "A valid event ID is required",
      });
    }

    const tickets = await getEventTickets(eventId);

    return res.status(200).json({
      message: "Event tickets fetched successfully",
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/organisers/events/:eventId/tickets/template
export const addTemplateToEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = Number(req.params.eventId);
    const templateId = Number(req.body.ticket_id);
    const userId = req.user?.id;

    if (!Number.isInteger(eventId) || eventId <= 0 ||
        !Number.isInteger(templateId) || templateId <= 0) {
      return res.status(400).json({
        message: "Valid event and ticket IDs are required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!(await getOwnedEvent(eventId, Number(userId)))) {
      return res.status(403).json({
        message: "You cannot modify tickets for this event",
      });
    }

    const result = await assignTemplateToEvent(
      eventId,
      templateId
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Ticket template is inactive or does not match the event category",
      });
    }

    return res.status(201).json({
      message: "Ticket template assigned to event successfully",
      eventTicketId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/organisers/events/:eventId/tickets/custom
export const addCustomEventTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = Number(req.params.eventId);
    const userId = req.user?.id;
    const { name, description, price } = req.body;

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        message: "A valid event ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!(await getOwnedEvent(eventId, Number(userId)))) {
      return res.status(403).json({
        message: "You cannot modify tickets for this event",
      });
    }

    const numericPrice = Number(price);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        message: "A valid ticket name and non-negative price are required",
      });
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
      message: "Custom ticket created successfully",
      eventTicketId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
};
