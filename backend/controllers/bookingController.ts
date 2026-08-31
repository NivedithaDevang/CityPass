import {
    getAllBookings,
    createBooking
} from "../models/bookingModel.js"
import { Request, Response, NextFunction } from "express";


//for getting all bookings
export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const results = await getAllBookings();

        res.status(200).json({
            message: "Bookings fetched successfully",
            bookings: results
        });
    } catch (err) {
        next(err);
    }
};

//for posting new booking
export const addBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { user_id, pass_id, booking_date, number_of_tickets, total_amount, status = "CONFIRMED" } = req.body;
        if (user_id === undefined || pass_id === undefined || !booking_date || number_of_tickets === undefined || total_amount === undefined) {
            return res.status(400).json({
                message: "user_id, pass_id, booking_date, number_of_tickets and total_amount are required"
            });
        }

        const result = await createBooking(
            { user_id, pass_id, booking_date, number_of_tickets, total_amount, status }
        );

        res.status(201).json({
            message: "Booking created successfully",
            bookingId: result?.insertId
        });
    } catch (err) {
        next(err);
    }
};


