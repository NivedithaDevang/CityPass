
import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2/promise";

import { db } from "../config/database.js";
import AppError from "../types/appError.js";

import {
  getBookingsByUserId,
  createBooking,
  cancelBookingTickets,
} from "../models/bookingModel.js";

import { validateId } from "../validators/idValidator.js";

interface ActiveEventTicket extends RowDataPacket {
  id: number;
  event_id: number;
  price: number | string;
}

// Get bookings belonging to the authenticated user.
export const getBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      throw new AppError(
        "Authentication required. Please sign in to view your bookings.",
        401
      );
    }

    const results = await getBookingsByUserId(
      Number(activeUserId)
    );

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      bookings: results,
    });
  } catch (err) {
    next(err);
  }
};

// Create a booking.
export const addBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      throw new AppError(
        "Authentication required. Please sign in to proceed.",
        401
      );
    }

    const {
      pass_id,
      event_ticket_id,
      number_of_tickets,
    } = req.body;

    const eventId = validateId(pass_id);
    const ticketId = validateId(event_ticket_id);

    const quantity = Number(number_of_tickets);

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      throw new AppError(
        "Ticket quantity must be a positive integer.",
        400
      );
    }

    // Confirm that the ticket belongs to this event and is active.
    const [ticketRows] = await db.query<ActiveEventTicket[]>(
      `
        SELECT
          et.id,
          et.event_id,
          et.price
        FROM event_tickets et
        INNER JOIN events e ON e.id = et.event_id
        WHERE et.id = ?
          AND et.event_id = ?
          AND et.status = 'ACTIVE'
        LIMIT 1
      `,
      [ticketId, eventId]
    );

    const ticket = ticketRows[0];

    if (!ticket) {
      throw new AppError(
        "This ticket is unavailable for the selected event.",
        404
      );
    }

    const ticketPrice = Number(ticket.price);

    if (
      !Number.isFinite(ticketPrice) ||
      ticketPrice < 0
    ) {
      throw new AppError(
        "The selected ticket has an invalid price.",
        400
      );
    }

    const totalAmount = Number(
      (ticketPrice * quantity).toFixed(2)
    );

    const result = await createBooking({
      user_id: Number(activeUserId),
      pass_id: eventId,
      event_ticket_id: ticketId,
      booking_date: new Date(),
      number_of_tickets: quantity,
      total_amount: totalAmount,
      status: "CONFIRMED",
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      bookingId: result.insertId,
      event_ticket_id: ticketId,
      number_of_tickets: quantity,
      ticket_price: ticketPrice,
      total_amount: totalAmount,
      status: "CONFIRMED",
    });
  } catch (err) {
    next(err);
  }
};

// Cancel all tickets or a selected number of tickets.
export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      throw new AppError(
        "Please log in to manage your bookings.",
        401
      );
    }

    const bookingId = validateId(req.params.id);
    const { quantity } = req.body ?? {};

    // Accept a positive integer number or a numeric string.
    // Reject booleans, blank strings, decimals and invalid values.
    if (
      quantity !== undefined &&
      (
        (typeof quantity !== "number" &&
          typeof quantity !== "string") ||
        (typeof quantity === "string" &&
          quantity.trim() === "") ||
        !Number.isSafeInteger(Number(quantity)) ||
        Number(quantity) <= 0
      )
    ) {
      throw new AppError(
        "Cancellation quantity must be a positive integer.",
        400
      );
    }

    // When quantity is omitted, the model cancels all tickets.
    const result = await cancelBookingTickets(
      bookingId,
      Number(activeUserId),
      quantity === undefined
        ? undefined
        : Number(quantity)
    );

    return res.status(200).json({
      success: true,
      message:
        result.remainingTickets === 0
          ? "All tickets cancelled successfully."
          : "Selected tickets cancelled successfully.",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
