
import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2/promise";
import { db } from "../config/database.js";
import {
  getBookingsByUserId,
  createBooking,
  updateBookingStatus,
} from "../models/bookingModel.js";

export const getBookings = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      return res.status(401).json({
        message:
          "Authentication required. Please sign in to view your bookings.",
      });
    }

    const results = await getBookingsByUserId(Number(activeUserId));

    return res.status(200).json({
      message: "Bookings fetched successfully",
      bookings: results,
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);

    return res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};

interface ActiveEventTicket extends RowDataPacket {
  id: number;
  event_id: number;
  price: number | string;
}

export const addBooking = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      return res.status(401).json({
        message: "Authentication required. Please sign in to proceed.",
      });
    }

    const { pass_id, event_ticket_id, number_of_tickets } = req.body;

    const eventId = Number(pass_id);
    const ticketId = Number(event_ticket_id);
    const quantity = Number(number_of_tickets);

    if (
      !Number.isInteger(eventId) ||
      eventId <= 0 ||
      !Number.isInteger(ticketId) ||
      ticketId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message: "Select a valid event ticket and quantity.",
      });
    }

    // Confirm that the selected ticket belongs to this event and is active.
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
      return res.status(400).json({
        message: "This ticket is unavailable for the selected event.",
      });
    }

    const ticketPrice = Number(ticket.price);

    if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
      return res.status(400).json({
        message: "The selected ticket has an invalid price.",
      });
    }

    // Calculate the total using the price stored in the database.
    const totalAmount = Number((ticketPrice * quantity).toFixed(2));

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
      message: "Booking created successfully",
      bookingId: result.insertId,
      event_ticket_id: ticketId,
      number_of_tickets: quantity,
      ticket_price: ticketPrice,
      total_amount: totalAmount,
      status: "CONFIRMED",
    });
  } catch (err) {
    console.error("Error creating booking:", err);

    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const bookingId = Number(req.params.id);
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      return res.status(401).json({
        message: "Please log in to manage your bookings.",
      });
    }

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        message: "Invalid booking ID.",
      });
    }

    await updateBookingStatus(
      bookingId,
      Number(activeUserId),
      "CANCELLED"
    );

    return res.status(200).json({
      message: "Booking cancelled successfully",
      bookingId,
      status: "CANCELLED",
    });
  } catch (err) {
    console.error("Error cancelling booking:", err);

    return res.status(500).json({
      message: "Failed to cancel booking",
    });
  }
};
