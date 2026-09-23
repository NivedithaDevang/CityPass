import { Request, Response, NextFunction } from "express";
import { getAllBookings, createBooking } from "../models/bookingModel.js";

export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await getAllBookings();

    res.status(200).json({
      message: "Bookings fetched successfully",
      bookings: results
    });
  } catch (err: any) {
    console.error("GET bookings SQL error:", err.message);
    res.status(500).json({ message: err.sqlMessage || err.message });
  }
};

export const addBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
        //destructuring in stead of declaring one by one
    const {
      user_id,
      pass_id,
      event_id,
      booking_date,
      number_of_tickets,
      total_amount,
      status = "CONFIRMED",
    } = req.body;

//If req.user exists, get its id. Otherwise return undefined instead of throwing an error.
// Get the logged-in user's ID from the JWT authentication middleware.
    const activeUserId = req.user?.id;
    
    // Use pass_id when provided.
// If pass_id is not available, use event_id as a fallback.
    const activePassId = pass_id ?? event_id;

    if (!activeUserId) {
      return res.status(401).json({
        message: "User ID is required. Please log in again.",
      });
    }

    if (!activePassId || !booking_date || number_of_tickets === undefined || total_amount === undefined) {
      return res.status(400).json({
        message: "pass_id, booking_date, number_of_tickets, and total_amount are required",
      });
    }

    const result = await createBooking({
      user_id: Number(activeUserId),
      pass_id: Number(activePassId),
      booking_date,
      number_of_tickets: Number(number_of_tickets),
      total_amount: Number(total_amount),
      status,
    });

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result?.insertId,
    });
  } catch (err: any) {
    console.error("SQL Error in addBooking:", err.message, err.sqlMessage);
    res.status(500).json({
      message: err.sqlMessage || err.message || "Failed to create booking",
    });
  }
};