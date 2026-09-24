import { Request, Response, NextFunction } from "express";
import { getAllBookings, createBooking, updateBookingStatus } from "../models/bookingModel.js";

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
    const {
      user_id,
      pass_id,
      event_id,
      booking_date,
      number_of_tickets,
      total_amount,
      status = "CONFIRMED",
    } = req.body;

    // Check all potential sources for the user's ID:
    const activeUserId = req.body.user_id;

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


export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const activeUserId = 
    req.body.user_id;

    if (!activeUserId) {
      return res.status(401).json({ message: "Please log in to manage your bookings." });
    }

    
    await updateBookingStatus(Number(id), Number(activeUserId), "CANCELLED");

    res.status(200).json({
      message: "Booking cancelled successfully",
      bookingId: Number(id),
      status: "CANCELLED",
    });
  } catch (err: any) {
    console.error("Error cancelling booking:", err);
    res.status(500).json({ message: err.sqlMessage || err.message || "Failed to cancel booking" });
  }
};