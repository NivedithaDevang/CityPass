import { Request, Response, NextFunction } from "express";
import {
  getBookingsByUserId,
  createBooking,
  updateBookingStatus,
} from "../models/bookingModel.js";


export const getBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get logged-in user from JWT
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      return res.status(401).json({
        message: "Authentication required. Please sign in to view your bookings.",
      });
    }

    const results = await getBookingsByUserId(Number(activeUserId));

    res.status(200).json({
      message: "Bookings fetched successfully",
      bookings: results,
    });
  } catch (err: any) {
    console.error("Error fetching bookings:", err);

    res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};

export const addBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      pass_id,
      booking_date,
      number_of_tickets,
      total_amount,
      status = "CONFIRMED",
    } = req.body;

    // Get logged-in user from JWT
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      return res.status(401).json({
        message: "Authentication required. Please sign in to proceed.",
      });
    }

    // Check required booking fields
    if (
      !pass_id ||
      number_of_tickets === undefined ||
      total_amount === undefined
    ) {
      return res.status(400).json({
        message: "Something went wrong. Please try again.",
      });
    }

    const result = await createBooking({
      user_id: Number(activeUserId),
      pass_id: Number(pass_id),
      booking_date: booking_date || new Date(),
      number_of_tickets: Number(number_of_tickets),
      total_amount: Number(total_amount),
      status,
    });

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertId,
    });
  } catch (err: any) {
    console.error("SQL Error in addBooking:", err);

    res.status(500).json({
      message: "Failed to create booking",
    });
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const activeUserId = req.user?.id;

    if (!activeUserId) {
      return res.status(401).json({
        message: "Please log in to manage your bookings.",
      });
    }

    await updateBookingStatus(
      Number(id),
      Number(activeUserId),
      "CANCELLED"
    );

    res.status(200).json({
      message: "Booking cancelled successfully",
      bookingId: Number(id),
      status: "CANCELLED",
    });
  } catch (err: any) {
    console.error("Error cancelling booking:", err);

    res.status(500).json({
      message: "Failed to cancel booking",
    });
  }
};